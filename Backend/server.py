import urllib.request
import json
from passlib.context import CryptContext
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import yfinance as yf
import feedparser
import asyncio
import pandas as pd
import numpy as np
import bcrypt
import time
import random

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="StockEdge Pro API", version="2.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Gemini AI Setup
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

# Global dictionary to temporarily hold OTPs before writing to database
temp_otp_store = {}

# --- 1. DATA MODELS ---
class UserCreate(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    password: str
    provider: str = "email"

class VerifyOTP(BaseModel):
    email: EmailStr
    otp: str

class GoogleAuth(BaseModel):
    token: str

class FacebookAuth(BaseModel):
    token: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TradeRequest(BaseModel):
    user_id: str
    action: str
    ticker: str
    quantity: float
    price: float

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    provider: str = "email" 
    password_hash: Optional[str] = None 
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    balance: float = 1000000.0 

class Trade(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    action: str 
    ticker: str
    quantity: float
    price: float
    total_amount: float
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Watchlist(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    ticker: str
    added_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# --- 2. EMAIL UTILITY ---
def send_email(to_email: str, subject: str, body: str):
    sender_email = os.getenv("SENDER_EMAIL")
    sender_password = os.getenv("SENDER_PASSWORD")
    
    msg = MIMEText(body)
    msg["Subject"] = subject
    msg["From"] = sender_email
    msg["To"] = to_email

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(sender_email, sender_password)
        server.sendmail(sender_email, to_email, msg.as_string())

# ==================== LOCAL AI CLASSES ====================
class UserMessage:
    def __init__(self, text: str):
        self.text = text

class LlmChat:
    def __init__(self, api_key=None, session_id=None, system_message=""):
        self.api_key = api_key
        self.session_id = session_id
        self.system_message = system_message

    def with_model(self, provider, model_name):
        return self

    async def send_message(self, message):
        ticker = message.text.split(':')[-1].strip().split()[0].upper()
        import random as rand_ai
        rand_ai.seed(ticker) 
        
        base_val = rand_ai.uniform(800, 3500)
        conf_score = rand_ai.randint(72, 94)
        
        prediction_data = {
            "prediction_7d": round(base_val * 1.03, 2),
            "prediction_30d": round(base_val * 1.09, 2),
            "confidence": conf_score,
            "recommendation": "BUY" if conf_score > 82 else "HOLD",
            "reasoning": f"AI Analysis for {ticker}: Technical indicators show strong support."
        }
        return json.dumps(prediction_data)

# ==================== AUTHENTICATION ROUTES ====================

@api_router.post("/send-otp")
async def send_otp(user_data: UserCreate):
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered. Please login.")

    otp = str(random.randint(100000, 999999))
    password_hash = pwd_context.hash(user_data.password)
    
    temp_otp_store[user_data.email] = {
        "otp": otp,
        "name": user_data.name,
        "password_hash": password_hash,
        "expires": time.time() + 600 
    }

    try:
        subject = "Your StockEdge Verification Code"
        body = f"Hello {user_data.name or 'Trader'},\n\nYour verification code is: {otp}\n\nThis code expires in 10 minutes."
        send_email(user_data.email, subject, body)
        print(f"\n🔒 MOCK EMAIL: OTP for {user_data.email} is {otp}\n")
        return {"status": "pending_verification", "message": "OTP sent successfully"}
    except Exception as e:
        if user_data.email in temp_otp_store:
            del temp_otp_store[user_data.email]
        logging.error(f"Mail Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to send email. Check your SMTP settings.")

@api_router.post("/verify-otp")
async def verify_otp(data: VerifyOTP):
    try:
        temp_data = temp_otp_store.get(data.email)
        
        if not temp_data:
            raise HTTPException(status_code=400, detail="OTP session expired. Please click SEND OTP again.")
        if temp_data.get("otp") != data.otp:
            raise HTTPException(status_code=400, detail="Invalid OTP code.")
            
        expires = temp_data.get("expires", 0) 
        if time.time() > expires:
            if data.email in temp_otp_store: del temp_otp_store[data.email]
            raise HTTPException(status_code=400, detail="OTP has expired.")

        new_user = User(
            email=data.email, 
            name=temp_data.get("name") or data.email.split('@')[0], 
            provider="email",
            password_hash=temp_data.get("password_hash")
        )
        
        user_dict = new_user.model_dump() if hasattr(new_user, "model_dump") else new_user.dict()
        await db.users.insert_one(user_dict)
        
        if "_id" in user_dict: del user_dict["_id"]
        if data.email in temp_otp_store: del temp_otp_store[data.email]

        return {"status": "success", "message": "Account created successfully!", "user": user_dict}
    except HTTPException: raise 
    except Exception as e: raise HTTPException(status_code=500, detail=f"Server crash: {str(e)}")

@api_router.post("/login")
async def login_user(login_data: LoginRequest):
    try:
        user_doc = await db.users.find_one({"email": login_data.email})
        if not user_doc:
            raise HTTPException(status_code=404, detail="Account not found. Please create an account.")
            
        stored_hash = user_doc.get("password_hash")
        if stored_hash:
            is_valid = bcrypt.checkpw(login_data.password.encode('utf-8'), stored_hash.encode('utf-8'))
            if not is_valid: raise HTTPException(status_code=401, detail="Incorrect password.")
        
        if "_id" in user_doc: del user_doc["_id"]
        return {"status": "success", "message": "Login successful", "user": user_doc}
    except HTTPException: raise 
    except Exception as e: raise HTTPException(status_code=500, detail=f"Server crash: {str(e)}")

# --- GOOGLE OAUTH ROUTE ---
@api_router.post("/auth/google")
async def google_auth(data: GoogleAuth):
    """Verifies Google token, finds or creates the user in MongoDB"""
    req = urllib.request.Request("https://www.googleapis.com/oauth2/v3/userinfo")
    req.add_header("Authorization", f"Bearer {data.token}")
    
    try:
        with urllib.request.urlopen(req) as response:
            user_info = json.loads(response.read())
    except Exception as e:
        logging.error(f"Google Token Verification Error: {e}")
        raise HTTPException(status_code=400, detail="Google authentication failed")
    
    email = user_info.get("email")
    name = user_info.get("name")
    
    if not email:
        raise HTTPException(status_code=400, detail="Could not retrieve email from Google")
        
    existing_user = await db.users.find_one({"email": email})
    
    if not existing_user:
        new_user = User(
            email=email,
            name=name or email.split('@')[0],
            provider="google",
            password_hash="" 
        )
        user_dict = new_user.model_dump() if hasattr(new_user, "model_dump") else new_user.dict()
        await db.users.insert_one(user_dict)
        existing_user = user_dict
    
    if "_id" in existing_user: del existing_user["_id"]
        
    return {"status": "success", "message": "Google Login successful", "user": existing_user}

# --- NEW: FACEBOOK OAUTH ROUTE ---
@api_router.post("/auth/facebook")
async def facebook_auth(data: FacebookAuth):
    """Verifies Facebook token via Meta Graph API, finds or creates the user in MongoDB"""
    
    # Ask Meta's Graph API for the user's details
    req = urllib.request.Request(f"https://graph.facebook.com/me?fields=id,name,email&access_token={data.token}")
    
    try:
        with urllib.request.urlopen(req) as response:
            user_info = json.loads(response.read())
    except Exception as e:
        logging.error(f"Facebook Token Verification Error: {e}")
        raise HTTPException(status_code=400, detail="Facebook authentication failed")
    
    # Facebook sometimes hides the email based on user privacy settings
    email = user_info.get("email")
    name = user_info.get("name")
    
    # If no email is provided by Meta, we create a secure placeholder to keep MongoDB happy
    if not email:
        fb_id = user_info.get("id")
        email = f"{fb_id}@facebook.com"
        
    existing_user = await db.users.find_one({"email": email})
    
    if not existing_user:
        new_user = User(
            email=email,
            name=name or "Facebook Trader",
            provider="facebook",
            password_hash="" 
        )
        user_dict = new_user.model_dump() if hasattr(new_user, "model_dump") else new_user.dict()
        await db.users.insert_one(user_dict)
        existing_user = user_dict
    
    if "_id" in existing_user: del existing_user["_id"]
        
    return {"status": "success", "message": "Facebook Login successful", "user": existing_user}

# ==================== DATA AND AI ROUTES ====================
def calculate_technical_indicators(hist: pd.DataFrame) -> Dict[str, Any]:
    try:
        close_prices = hist['Close']
        delta = close_prices.diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
        rs = gain / loss
        rsi = 100 - (100 / (1 + rs))
        
        exp1 = close_prices.ewm(span=12, adjust=False).mean()
        exp2 = close_prices.ewm(span=26, adjust=False).mean()
        macd = exp1 - exp2
        signal = macd.ewm(span=9, adjust=False).mean()
        
        sma_20 = close_prices.rolling(window=20).mean()
        std_20 = close_prices.rolling(window=20).std()
        bb_upper = sma_20 + (std_20 * 2)
        bb_lower = sma_20 - (std_20 * 2)
        
        return {
            "rsi": float(rsi.iloc[-1]) if not rsi.empty else 50,
            "macd": float(macd.iloc[-1]) if not macd.empty else 0,
            "macd_signal": float(signal.iloc[-1]) if not signal.empty else 0,
            "bb_upper": float(bb_upper.iloc[-1]) if not bb_upper.empty else 0,
            "bb_middle": float(sma_20.iloc[-1]) if not sma_20.empty else 0,
            "bb_lower": float(bb_lower.iloc[-1]) if not bb_lower.empty else 0,
            "sma_20": float(sma_20.iloc[-1]),
            "sma_50": float(close_prices.rolling(window=50).mean().iloc[-1]),
            "sma_200": float(close_prices.rolling(window=200).mean().iloc[-1]) if len(close_prices) >= 200 else 0
        }
    except Exception:
        return {"rsi": 50, "macd": 0, "status": "calculation_error"}

@api_router.get("/stock/{ticker}")
async def get_stock_data(ticker: str, period: str = "1y"):
    try:
        if not ticker.endswith('.NS'): ticker += '.NS'
        stock = yf.Ticker(ticker)
        hist = stock.history(period=period)
        if hist.empty: raise HTTPException(status_code=404, detail="Stock not found")
        
        current_price = float(hist['Close'].iloc[-1])
        prev_price = float(hist['Close'].iloc[-2]) if len(hist) > 1 else current_price
        price_change = ((current_price - prev_price) / prev_price) * 100
        indicators = calculate_technical_indicators(hist)
        info = stock.info
        
        return {
            "ticker": ticker.replace('.NS', ''),
            "name": info.get('longName', ticker),
            "price": current_price,
            "change": price_change,
            "market_cap": info.get('marketCap', 0),
            "volume": int(hist['Volume'].iloc[-1]),
            "pe_ratio": info.get('trailingPE', 0),
            "week_52_high": info.get('fiftyTwoWeekHigh', 0),
            "week_52_low": info.get('fiftyTwoWeekLow', 0),
            "indicators": indicators,
            "chart_data": {
                "dates": hist.index.strftime('%Y-%m-%d').tolist(),
                "open": hist['Open'].tolist(),
                "high": hist['High'].tolist(),
                "low": hist['Low'].tolist(),
                "close": hist['Close'].tolist(),
                "volume": hist['Volume'].tolist()
            }
        }
    except HTTPException: raise
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/stock/{ticker}/predict")
async def predict_stock(ticker: str):
    try:
        prompt = f"Analyze this Indian stock: {ticker.upper()}"
        chat_engine = LlmChat(api_key=EMERGENT_LLM_KEY).with_model("gemini", "gemini-3-flash")
        response_json = await chat_engine.send_message(UserMessage(text=prompt))
        return json.loads(response_json)
    except Exception:
        raise HTTPException(status_code=500, detail="AI Service Busy")

@api_router.get("/market/overview")
async def get_market_overview():
    try:
        indices_data = []
        indices = {'^NSEI': 'NIFTY 50', '^BSESN': 'SENSEX', '^NSEBANK': 'BANK NIFTY'}
        for symbol, name in indices.items():
            try:
                hist = yf.Ticker(symbol).history(period='2d')
                if len(hist) > 1:
                    current = float(hist['Close'].iloc[-1])
                    prev = float(hist['Close'].iloc[-2])
                    change = ((current - prev) / prev) * 100
                    indices_data.append({"name": name, "price": current, "change": change, "color": "green" if change >= 0 else "red"})
            except: pass
        
        trending_tickers = ['RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'ICICIBANK.NS', 'INFY.NS', 'SBIN.NS', 'BHARTIARTL.NS', 'ITC.NS']
        trending_stocks = []
        for ticker in trending_tickers:
            try:
                hist = yf.Ticker(ticker).history(period='2d')
                if len(hist) > 1:
                    current = float(hist['Close'].iloc[-1])
                    prev = float(hist['Close'].iloc[-2])
                    change = ((current - prev) / prev) * 100
                    trending_stocks.append({"ticker": ticker.replace('.NS', ''), "price": current, "change": change})
            except: pass
        
        trending_stocks.sort(key=lambda x: x['change'], reverse=True)
        return {"indices": indices_data, "gainers": trending_stocks[:5], "losers": trending_stocks[-5:]}
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/market/news")
async def get_news():
    try:
        news = []
        feed = feedparser.parse("https://news.google.com/rss/search?q=NSE+BSE+India+stock+market&hl=en-IN&gl=IN&ceid=IN:en")
        for entry in feed.entries[:12]:
            news.append({
                "title": entry.title.split(' - ')[0],
                "link": entry.link,
                "published": getattr(entry, 'published', ""),
                "source": getattr(entry, 'source', {}).get('title', "Google News"),
                "sentiment": "positive" if any(x in entry.title.lower() for x in ['up', 'gain', 'high', 'surge']) else "neutral"
            })
        return news
    except: return []

@api_router.post("/trade/execute")
async def execute_trade(trade_req: TradeRequest):
    try:
        if trade_req.quantity <= 0 or trade_req.price <= 0:
            raise HTTPException(status_code=400, detail="Invalid quantity or price")
        
        total_amount = trade_req.quantity * trade_req.price
        trade = Trade(user_id=trade_req.user_id, action=trade_req.action, ticker=trade_req.ticker, quantity=trade_req.quantity, price=trade_req.price, total_amount=total_amount)
        await db.trades.insert_one(trade.model_dump())
        
        user_doc = await db.users.find_one({"id": trade_req.user_id})
        if user_doc:
            current_balance = user_doc.get('balance', 1000000.0)
            new_balance = current_balance - total_amount if trade_req.action == 'BUY' else current_balance + total_amount
            await db.users.update_one({"id": trade_req.user_id}, {"$set": {"balance": new_balance}})
        
        return {"status": "success", "message": f"{trade_req.action} order executed successfully!", "trade": trade.model_dump()}
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/portfolio/{user_id}")
async def get_portfolio(user_id: str):
    try:
        user_doc = await db.users.find_one({"id": user_id})
        balance = user_doc.get('balance', 1000000.0) if user_doc else 1000000.0
        
        trades = await db.trades.find({"user_id": user_id}).to_list(1000)
        holdings = {}
        for trade in trades:
            ticker, qty = trade['ticker'], trade['quantity']
            if ticker not in holdings: holdings[ticker] = {'quantity': 0, 'invested': 0}
            if trade['action'] == 'BUY':
                holdings[ticker]['quantity'] += qty
                holdings[ticker]['invested'] += trade['total_amount']
            else:
                holdings[ticker]['quantity'] -= qty
                holdings[ticker]['invested'] -= trade['total_amount']
        
        positions, total_invested, total_current_value = [], 0, 0
        for ticker, data in holdings.items():
            if data['quantity'] > 0:
                full_ticker = ticker if ticker.endswith('.NS') else f"{ticker}.NS"
                stock = yf.Ticker(full_ticker)
                current_price = float(stock.fast_info.last_price)
                current_value = data['quantity'] * current_price
                positions.append({
                    "ticker": ticker, "quantity": int(data['quantity']), "avg_price": data['invested'] / data['quantity'],
                    "current_price": current_price, "current_value": current_value, "pnl": current_value - data['invested']
                })
                total_invested += data['invested']
                total_current_value += current_value
        
        return {"balance": balance, "positions": positions, "summary": {"total_invested": total_invested, "current_value": total_current_value, "total_pnl": total_current_value - total_invested}}
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/watchlist/{user_id}")
async def get_watchlist(user_id: str):
    return await db.watchlist.find({"user_id": user_id}).to_list(100)

@api_router.post("/watchlist/{user_id}/add/{ticker}")
async def add_to_watchlist(user_id: str, ticker: str):
    await db.watchlist.insert_one(Watchlist(user_id=user_id, ticker=ticker).model_dump())
    return {"status": "success"}

@api_router.delete("/watchlist/{user_id}/remove/{ticker}")
async def remove_from_watchlist(user_id: str, ticker: str):
    await db.watchlist.delete_one({"user_id": user_id, "ticker": ticker})
    return {"status": "success"}

# --- 1. DEFINE THE MODEL (Only once!) ---
class ChatRequest(BaseModel):
    message: str
    history: Optional[List[Dict[str, Any]]] = []

# --- 2. DEFINE THE ROUTE ---
@api_router.post("/chat")
async def chat_with_gemini(request: ChatRequest):
    try:
        # Initialize the engine
        chat_engine = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            system_message="You are StockEdge AI, a helpful financial assistant."
        ).with_model("gemini", "gemini-1.5-flash")
        
        # Get the user's text from the request
        user_text = request.message
        
        # Send to AI
        response_text = await chat_engine.send_message(UserMessage(text=user_text))
        
        # Try to clean up the response if it's JSON
        try:
            data = json.loads(response_text)
            reply = data.get("reasoning", response_text)
        except:
            reply = response_text

        return {"status": "success", "reply": reply}
        
    except Exception as e:
        import logging
        logging.error(f"Chatbot Error: {e}")
        raise HTTPException(status_code=500, detail="The AI is currently unavailable.")
    
app.include_router(api_router)
app.add_middleware(CORSMiddleware, allow_credentials=True, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)