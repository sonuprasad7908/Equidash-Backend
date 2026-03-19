from contextlib import asynccontextmanager
from dotenv import load_dotenv
import os
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from groq import Groq
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

import stripe
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

import urllib.request
import json
import hmac
import hashlib
from passlib.context import CryptContext
import logging
import smtplib
from email.mime.text import MIMEText
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request
from fastapi.responses import JSONResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
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

mongo_url = os.environ['MONGO_URL']
mongo_client = AsyncIOMotorClient(mongo_url)
db = mongo_client[os.environ['DB_NAME']]

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 EquiDash Backend Engine Online")
    yield
    print("🛑 EquiDash Backend Engine Offline")
    mongo_client.close()

app = FastAPI(title="EquiDash Pro API", version="3.0", lifespan=lifespan)
api_router = APIRouter(prefix="/api")
temp_otp_store = {}

# ==================== DATA MODELS ====================
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

class WatchlistItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    ticker: str
    added_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChatRequest(BaseModel):
    message: str
    ticker: Optional[str] = "SBIN"
    user_id: Optional[str] = "guest"

class CreatePaymentIntent(BaseModel):
    amount: int
    user_id: str
    virtual_amount: int

class AlertCreate(BaseModel):
    user_id: str
    ticker: str
    target_price: float
    condition: str
    note: Optional[str] = ""

class UpdateProfileRequest(BaseModel):
    user_id: str
    name: str

class ChangePasswordRequest(BaseModel):
    user_id: str
    current_password: str
    new_password: str

class ResetBalanceRequest(BaseModel):
    user_id: str

# ==================== EMAIL ====================
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

# ==================== AUTH ====================
@api_router.post("/send-otp")
async def send_otp(user_data: UserCreate):
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered. Please login.")
    otp = str(random.randint(100000, 999999))
    password_hash = pwd_context.hash(user_data.password)
    temp_otp_store[user_data.email] = {
        "otp": otp, "name": user_data.name,
        "password_hash": password_hash, "expires": time.time() + 600
    }
    try:
        subject = "Your EquiDash Verification Code"
        body = f"Hello {user_data.name or 'Trader'},\n\nYour verification code is: {otp}\n\nThis code expires in 10 minutes."
        send_email(user_data.email, subject, body)
        print(f"\n🔒 OTP for {user_data.email} is {otp}\n")
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
        if time.time() > temp_data.get("expires", 0):
            if data.email in temp_otp_store:
                del temp_otp_store[data.email]
            raise HTTPException(status_code=400, detail="OTP has expired.")
        new_user = User(
            email=data.email,
            name=temp_data.get("name") or data.email.split('@')[0],
            provider="email",
            password_hash=temp_data.get("password_hash")
        )
        user_dict = new_user.model_dump()
        await db.users.insert_one(user_dict)
        user_dict.pop("_id", None)
        if data.email in temp_otp_store:
            del temp_otp_store[data.email]
        return {"status": "success", "message": "Account created successfully!", "user": user_dict}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

@api_router.post("/login")
async def login_user(login_data: LoginRequest):
    try:
        user_doc = await db.users.find_one({"email": login_data.email})
        if not user_doc:
            raise HTTPException(status_code=404, detail="Account not found. Please create an account.")
        stored_hash = user_doc.get("password_hash")
        if stored_hash:
            is_valid = bcrypt.checkpw(login_data.password.encode('utf-8'), stored_hash.encode('utf-8'))
            if not is_valid:
                raise HTTPException(status_code=401, detail="Incorrect password.")
        user_doc.pop("_id", None)
        return {"status": "success", "message": "Login successful", "user": user_doc}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

@api_router.post("/auth/google")
async def google_auth(data: GoogleAuth):
    req = urllib.request.Request("https://www.googleapis.com/oauth2/v3/userinfo")
    req.add_header("Authorization", f"Bearer {data.token}")
    try:
        with urllib.request.urlopen(req) as response:
            user_info = json.loads(response.read())
    except Exception as e:
        logging.error(f"Google Token Error: {e}")
        raise HTTPException(status_code=400, detail="Google authentication failed")
    email = user_info.get("email")
    name = user_info.get("name")
    if not email:
        raise HTTPException(status_code=400, detail="Could not retrieve email from Google")
    existing_user = await db.users.find_one({"email": email})
    if not existing_user:
        new_user = User(email=email, name=name or email.split('@')[0], provider="google", password_hash="")
        user_dict = new_user.model_dump()
        await db.users.insert_one(user_dict)
        existing_user = user_dict
    existing_user.pop("_id", None)
    return {"status": "success", "message": "Google Login successful", "user": existing_user}

@api_router.post("/auth/facebook")
async def facebook_auth(data: FacebookAuth):
    req = urllib.request.Request(f"https://graph.facebook.com/me?fields=id,name,email&access_token={data.token}")
    try:
        with urllib.request.urlopen(req) as response:
            user_info = json.loads(response.read())
    except Exception as e:
        logging.error(f"Facebook Token Error: {e}")
        raise HTTPException(status_code=400, detail="Facebook authentication failed")
    email = user_info.get("email")
    name = user_info.get("name")
    if not email:
        fb_id = user_info.get("id")
        email = f"{fb_id}@facebook.com"
    existing_user = await db.users.find_one({"email": email})
    if not existing_user:
        new_user = User(email=email, name=name or "Facebook Trader", provider="facebook", password_hash="")
        user_dict = new_user.model_dump()
        await db.users.insert_one(user_dict)
        existing_user = user_dict
    existing_user.pop("_id", None)
    return {"status": "success", "message": "Facebook Login successful", "user": existing_user}

# ==================== TECHNICAL INDICATORS ====================
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

# ==================== STOCK ROUTES ====================
@api_router.get("/stock/{ticker}")
async def get_stock_data(ticker: str):
    search_ticker = ticker.upper()
    if not search_ticker.endswith(".NS") and not search_ticker.endswith(".BO"):
        search_ticker = f"{search_ticker}.NS"
    try:
        stock = yf.Ticker(search_ticker)
        hist = stock.history(period="1y")
        if hist.empty:
            raise HTTPException(status_code=404, detail="Stock not found or delisted")
        current_price = float(hist['Close'].iloc[-1])
        prev_price = float(hist['Close'].iloc[-2]) if len(hist) > 1 else current_price
        price_change = ((current_price - prev_price) / prev_price) * 100
        indicators = calculate_technical_indicators(hist)
        info = stock.info
        return {
            "ticker": search_ticker.replace('.NS', '').replace('.BO', ''),
            "name": info.get('longName', search_ticker),
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
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/stock/{ticker}/predict")
async def predict_stock(ticker: str):
    """Real AI prediction using technical indicator scoring."""
    try:
        search_ticker = f"{ticker.upper()}.NS" if not ticker.upper().endswith('.NS') else ticker.upper()
        stock = yf.Ticker(search_ticker)
        hist = stock.history(period="3mo")
        if hist.empty:
            raise HTTPException(status_code=404, detail="Stock not found")

        close = hist['Close']
        current_price = float(close.iloc[-1])
        indicators = calculate_technical_indicators(hist)
        rsi = indicators.get("rsi", 50)
        macd = indicators.get("macd", 0)
        macd_signal = indicators.get("macd_signal", 0)
        sma_20 = indicators.get("sma_20", current_price)
        sma_50 = indicators.get("sma_50", current_price)

        prev_week_price = float(close.iloc[-5]) if len(close) >= 5 else current_price
        momentum_1w = ((current_price - prev_week_price) / prev_week_price) * 100

        score = 0
        reasons = []

        if rsi < 35:
            score += 2
            reasons.append(f"RSI {rsi:.1f} — oversold zone (bullish signal)")
        elif rsi > 70:
            score -= 2
            reasons.append(f"RSI {rsi:.1f} — overbought zone (bearish signal)")
        else:
            reasons.append(f"RSI {rsi:.1f} — neutral zone")

        if macd > macd_signal:
            score += 1
            reasons.append("MACD crossed above signal line (bullish)")
        else:
            score -= 1
            reasons.append("MACD below signal line (bearish)")

        if current_price > sma_20:
            score += 1
            reasons.append("Price trading above 20-day SMA")
        else:
            score -= 1
            reasons.append("Price trading below 20-day SMA")

        if sma_20 > sma_50:
            score += 1
            reasons.append("20-day SMA above 50-day SMA (uptrend)")
        else:
            reasons.append("20-day SMA below 50-day SMA (downtrend)")

        if momentum_1w > 1:
            score += 1
            reasons.append(f"Strong 1-week momentum: +{momentum_1w:.2f}%")
        elif momentum_1w < -1:
            score -= 1
            reasons.append(f"Weak 1-week momentum: {momentum_1w:.2f}%")

        if score >= 4:
            recommendation = "STRONG BUY"
        elif score >= 2:
            recommendation = "BUY"
        elif score >= 0:
            recommendation = "HOLD"
        elif score >= -2:
            recommendation = "SELL"
        else:
            recommendation = "STRONG SELL"

        confidence = min(94, max(48, 60 + (score * 7)))

        upside_factor = 1 + max(0.01, momentum_1w / 100 * 1.5)
        downside_factor = 1 + min(-0.01, momentum_1w / 100 * 1.5)

        if score >= 0:
            target_7d = round(current_price * upside_factor, 2)
            target_30d = round(current_price * (1 + (score * 0.015) + 0.02), 2)
        else:
            target_7d = round(current_price * downside_factor, 2)
            target_30d = round(current_price * (1 + (score * 0.015) - 0.02), 2)

        return {
            "current_price": round(current_price, 2),
            "prediction_7d": target_7d,
            "prediction_30d": target_30d,
            "confidence": round(confidence, 1),
            "recommendation": recommendation,
            "reasoning": " | ".join(reasons[:3]),
            "score": score
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"🚨 PREDICT CRASH: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

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
                    indices_data.append({"name": name, "price": current, "change": change})
            except:
                pass
        trending_tickers = [
            'RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'ICICIBANK.NS',
            'INFY.NS', 'SBIN.NS', 'BHARTIARTL.NS', 'ITC.NS', 'TMPV.NS', 'TMCV.NS'
        ]
        trending_stocks = []
        for t in trending_tickers:
            try:
                hist = yf.Ticker(t).history(period='2d')
                if len(hist) > 1:
                    current = float(hist['Close'].iloc[-1])
                    prev = float(hist['Close'].iloc[-2])
                    change = ((current - prev) / prev) * 100
                    display = t.replace('.NS', '').replace('.BO', '')
                    if display == 'TMPV': display = 'TATAMOTORS(PV)'
                    if display == 'TMCV': display = 'TATAMOTORS(CV)'
                    trending_stocks.append({"ticker": display, "price": current, "change": change})
            except:
                pass
        trending_stocks.sort(key=lambda x: x['change'], reverse=True)
        return {"indices": indices_data, "gainers": trending_stocks[:5], "losers": trending_stocks[-5:]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/market/global-indices")
async def get_global_indices():
    try:
        global_tickers = {
            '^GSPC': 'S&P 500', '^IXIC': 'NASDAQ',
            '^DJI': 'Dow Jones', '^FTSE': 'FTSE 100',
            '^N225': 'Nikkei 225', '^HSI': 'Hang Seng',
        }
        indices_data = []
        for symbol, name in global_tickers.items():
            try:
                hist = yf.Ticker(symbol).history(period='2d')
                if len(hist) > 1:
                    current = float(hist['Close'].iloc[-1])
                    prev = float(hist['Close'].iloc[-2])
                    change = ((current - prev) / prev) * 100
                    currency = "£" if symbol == '^FTSE' else "¥" if symbol == '^N225' else "HK$" if symbol == '^HSI' else "$"
                    indices_data.append({"name": name, "price": current, "change": change, "currency": currency})
            except:
                pass
        return indices_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/market/news")
async def get_news():
    try:
        news = []
        feed = feedparser.parse("https://news.google.com/rss/search?q=NSE+BSE+India+stock+market&hl=en-IN&gl=IN&ceid=IN:en")
        positive_words = ['up', 'gain', 'high', 'surge', 'rally', 'rise', 'bull', 'growth', 'profit', 'record']
        negative_words = ['down', 'fall', 'loss', 'crash', 'drop', 'bear', 'decline', 'sell-off', 'weak', 'slump']
        for entry in feed.entries[:15]:
            title_lower = entry.title.lower()
            if any(w in title_lower for w in positive_words):
                sentiment = "positive"
            elif any(w in title_lower for w in negative_words):
                sentiment = "negative"
            else:
                sentiment = "neutral"
            news.append({
                "title": entry.title.split(' - ')[0],
                "link": entry.link,
                "published": getattr(entry, 'published', ""),
                "source": getattr(entry, 'source', {}).get('title', "Google News"),
                "sentiment": sentiment
            })
        return news
    except:
        return []

# ==================== TRADE & PORTFOLIO ====================
@api_router.post("/trade/execute")
async def execute_trade(trade_req: TradeRequest):
    try:
        if trade_req.quantity <= 0 or trade_req.price <= 0:
            raise HTTPException(status_code=400, detail="Invalid quantity or price")
        total_amount = trade_req.quantity * trade_req.price
        trade = Trade(
            user_id=trade_req.user_id, action=trade_req.action,
            ticker=trade_req.ticker, quantity=trade_req.quantity,
            price=trade_req.price, total_amount=total_amount
        )
        await db.trades.insert_one(trade.model_dump())
        user_doc = await db.users.find_one({"id": trade_req.user_id})
        if user_doc:
            current_balance = user_doc.get('balance', 1000000.0)
            new_balance = current_balance - total_amount if trade_req.action == 'BUY' else current_balance + total_amount
            await db.users.update_one({"id": trade_req.user_id}, {"$set": {"balance": new_balance}})
        return {"status": "success", "message": f"{trade_req.action} order executed successfully!", "trade": trade.model_dump()}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/portfolio/{user_id}")
async def get_portfolio(user_id: str):
    try:
        user_doc = await db.users.find_one({"id": user_id})
        balance = user_doc.get('balance', 1000000.0) if user_doc else 1000000.0
        trades = await db.trades.find({"user_id": user_id}).to_list(1000)
        holdings = {}
        for trade in trades:
            t, qty = trade['ticker'], trade['quantity']
            if t not in holdings:
                holdings[t] = {'quantity': 0, 'invested': 0}
            if trade['action'] == 'BUY':
                holdings[t]['quantity'] += qty
                holdings[t]['invested'] += trade['total_amount']
            else:
                holdings[t]['quantity'] -= qty
                holdings[t]['invested'] -= trade['total_amount']
        positions, total_invested, total_current_value = [], 0, 0
        for t, data in holdings.items():
            if data['quantity'] > 0:
                full_ticker = t if t.endswith('.NS') else f"{t}.NS"
                stock = yf.Ticker(full_ticker)
                current_price = float(stock.fast_info.last_price)
                current_value = data['quantity'] * current_price
                positions.append({
                    "ticker": t, "quantity": int(data['quantity']),
                    "avg_price": data['invested'] / data['quantity'],
                    "current_price": current_price, "current_value": current_value,
                    "pnl": current_value - data['invested']
                })
                total_invested += data['invested']
                total_current_value += current_value
        return {
            "balance": balance, "positions": positions,
            "summary": {
                "total_invested": total_invested,
                "current_value": total_current_value,
                "total_pnl": total_current_value - total_invested
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

        
@api_router.get("/transactions/{user_id}")
async def get_transactions(user_id: str):
    try:
        trades = await db.trades.find(
            {"user_id": user_id}, {"_id": 0}
        ).sort("timestamp", -1).to_list(500)
        return {"trades": trades}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== WATCHLIST ====================
@api_router.get("/watchlist/{user_id}")
async def get_watchlist(user_id: str):
    items = await db.watchlist.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    return items

@api_router.post("/watchlist/{user_id}/add/{ticker}")
async def add_to_watchlist(user_id: str, ticker: str):
    existing = await db.watchlist.find_one({"user_id": user_id, "ticker": ticker.upper()})
    if existing:
        return {"status": "exists", "message": "Already in watchlist"}
    item = WatchlistItem(user_id=user_id, ticker=ticker.upper())
    await db.watchlist.insert_one(item.model_dump())
    return {"status": "success"}

@api_router.delete("/watchlist/{user_id}/remove/{ticker}")
async def remove_from_watchlist(user_id: str, ticker: str):
    await db.watchlist.delete_one({"user_id": user_id, "ticker": ticker.upper()})
    return {"status": "success"}

# ==================== CHAT ====================
@api_router.post("/chat")
async def chat_with_ai(req: ChatRequest):
    try:
        completion = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are EquiDash AI, an expert quantitative analyst and financial advisor "
                        "specializing in Indian stock markets (NSE/BSE). Be concise, professional, "
                        "and insightful. Keep responses to 2 short paragraphs. "
                        "Do not use markdown headers or bullet points."
                    )
                },
                {
                    "role": "user",
                    "content": f"The user is currently looking at stock ticker: {req.ticker}. They ask: {req.message}"
                }
            ],
            max_tokens=300,
            temperature=0.7
        )
        return {"reply": completion.choices[0].message.content}
    except Exception as e:
        print(f"🚨 Groq Crash: {e}")
        return {"reply": "My connection to the AI servers was interrupted. Please check your backend terminal."}

# ==================== STRIPE PAYMENTS ====================
@api_router.post("/payment/create-intent")
async def create_payment_intent(req: CreatePaymentIntent):
    try:
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": "inr",
                    "product_data": {
                        "name": "EquiDash Virtual Balance",
                        "description": f"Add ₹{req.virtual_amount:,} virtual trading balance"
                    },
                    "unit_amount": req.amount * 100
                },
                "quantity": 1
            }],
            mode="payment",
            success_url=f"{frontend_url}/payment-success?session_id={{CHECKOUT_SESSION_ID}}&user_id={req.user_id}&virtual_amount={req.virtual_amount}",
            cancel_url=f"{frontend_url}/pricing",
            metadata={"user_id": req.user_id, "virtual_amount": str(req.virtual_amount)}
        )
        return {"session_id": session.id, "client_secret": session.id}
    except Exception as e:
        print(f"🚨 Stripe Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/payment/verify-session")
async def verify_stripe_session(session_id: str, user_id: str, virtual_amount: int):
    try:
        session = stripe.checkout.Session.retrieve(session_id)
        if session.payment_status != "paid":
            raise HTTPException(status_code=400, detail="Payment not completed")
        existing = await db.payments.find_one({"stripe_session_id": session_id})
        if existing:
            user_doc = await db.users.find_one({"id": user_id})
            return {"status": "success", "message": "Already processed", "new_balance": user_doc.get("balance", 0)}
        user_doc = await db.users.find_one({"id": user_id})
        if not user_doc:
            raise HTTPException(status_code=404, detail="User not found")
        new_balance = user_doc.get("balance", 1000000.0) + virtual_amount
        await db.users.update_one({"id": user_id}, {"$set": {"balance": new_balance}})
        await db.payments.insert_one({
            "id": str(uuid.uuid4()), "user_id": user_id,
            "stripe_session_id": session_id, "virtual_amount_added": virtual_amount,
            "timestamp": datetime.now(timezone.utc).isoformat(), "status": "success"
        })
        return {"status": "success", "message": f"₹{virtual_amount:,} added!", "new_balance": new_balance}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/payment/history/{user_id}")
async def get_payment_history(user_id: str):
    try:
        payments = await db.payments.find({"user_id": user_id}, {"_id": 0}).sort("timestamp", -1).to_list(50)
        return {"payments": payments}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== PRICE ALERTS ====================
@api_router.post("/alerts/create")
async def create_alert(req: AlertCreate):
    try:
        alert = {
            "id": str(uuid.uuid4()),
            "user_id": req.user_id,
            "ticker": req.ticker.upper(),
            "target_price": req.target_price,
            "condition": req.condition,
            "note": req.note,
            "triggered": False,
            "triggered_at": None,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.alerts.insert_one(alert)
        alert.pop("_id", None)
        return {"status": "success", "alert": alert}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/alerts/{user_id}")
async def get_alerts(user_id: str):
    try:
        alerts = await db.alerts.find({"user_id": user_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
        return {"alerts": alerts}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/alerts/{user_id}/{alert_id}")
async def delete_alert(user_id: str, alert_id: str):
    try:
        await db.alerts.delete_one({"id": alert_id, "user_id": user_id})
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/alerts/check/{user_id}")
async def check_alerts(user_id: str):
    try:
        alerts = await db.alerts.find(
            {"user_id": user_id, "triggered": False}, {"_id": 0}
        ).to_list(100)
        triggered = []
        for alert in alerts:
            try:
                ticker = alert["ticker"]
                hist = None
                for suffix in [".NS", ".BO", ""]:
                    try:
                        h = yf.Ticker(f"{ticker}{suffix}").history(period="1d")
                        if not h.empty:
                            hist = h
                            break
                    except:
                        continue
                if hist is None or hist.empty:
                    continue
                current_price = float(hist["Close"].iloc[-1])
                condition = alert["condition"]
                target = alert["target_price"]
                is_triggered = (
                    (condition == "above" and current_price >= target) or
                    (condition == "below" and current_price <= target)
                )
                if is_triggered:
                    await db.alerts.update_one(
                        {"id": alert["id"]},
                        {"$set": {
                            "triggered": True,
                            "triggered_at": datetime.now(timezone.utc).isoformat(),
                            "triggered_price": current_price
                        }}
                    )
                    alert["triggered"] = True
                    alert["triggered_price"] = current_price
                    triggered.append(alert)
            except Exception as e:
                print(f"Alert check error for {alert.get('ticker')}: {e}")
                continue
        return {"triggered": triggered, "checked": len(alerts)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== USER PROFILE ====================
@api_router.post("/user/update-profile")
async def update_profile(req: UpdateProfileRequest):
    try:
        await db.users.update_one({"id": req.user_id}, {"$set": {"name": req.name}})
        return {"status": "success", "message": "Profile updated!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/user/change-password")
async def change_password(req: ChangePasswordRequest):
    try:
        user_doc = await db.users.find_one({"id": req.user_id})
        if not user_doc:
            raise HTTPException(status_code=404, detail="User not found")
        stored_hash = user_doc.get("password_hash")
        if not stored_hash:
            raise HTTPException(status_code=400, detail="Password change not available for social logins")
        is_valid = bcrypt.checkpw(req.current_password.encode("utf-8"), stored_hash.encode("utf-8"))
        if not is_valid:
            raise HTTPException(status_code=401, detail="Current password is incorrect")
        new_hash = pwd_context.hash(req.new_password)
        await db.users.update_one({"id": req.user_id}, {"$set": {"password_hash": new_hash}})
        return {"status": "success", "message": "Password changed!"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/user/reset-balance")
async def reset_balance(req: ResetBalanceRequest):
    try:
        await db.users.update_one({"id": req.user_id}, {"$set": {"balance": 1000000.0}})
        return {"status": "success", "message": "Balance reset to ₹10,00,000!", "new_balance": 1000000.0}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== APP SETUP ====================
app.include_router(api_router)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:3000"), "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"]
)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)