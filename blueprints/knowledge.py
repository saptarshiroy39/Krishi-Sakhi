import os
from datetime import datetime

import google.generativeai as genai
import requests
from flask import Blueprint, jsonify, request
from groq import Groq

knowledge_bp = Blueprint("knowledge", __name__)


# Initialize API clients
def get_gemini_knowledge_client():
    """Get Gemini client for knowledge content using API key 2"""
    api_key = os.getenv("GEMINI_API_KEY_2")
    if not api_key:
        raise ValueError("Gemini API key 2 not configured for knowledge")

    genai.configure(api_key=api_key)
    return genai.GenerativeModel("gemini-2.5-flash")


def get_groq_client():
    """Get GROQ client for lightweight AI tasks"""
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ API key not configured")
    return Groq(api_key=api_key)


def get_openweather_api_key():
    """Get OpenWeather API key from environment"""
    api_key = os.getenv("OPENWEATHER_API_KEY")
    if not api_key:
        raise ValueError("OpenWeather API key not configured")
    return api_key


# OpenWeather API configuration
OPENWEATHER_BASE_URL = "http://api.openweathermap.org/data/2.5"


@knowledge_bp.route("/content", methods=["POST"])
def get_knowledge_content():
    try:
        data = request.get_json()
        prompt = data.get("prompt", "")
        category_id = data.get("category_id", 1)

        if not prompt:
            return jsonify({"success": False, "error": "Prompt is required"}), 400

        # Enhance prompt with current weather data for weather-related categories
        enhanced_prompt = prompt
        if category_id in [1, 3]:  # Crop Calendar and Weather Patterns
            try:
                weather_data = get_current_weather("Kochi")
                if weather_data:
                    weather_context = f"\n\nCurrent weather in Kerala: Temperature: {weather_data['temperature']}°C, Condition: {weather_data['description']}, Humidity: {weather_data['humidity']}%"
                    enhanced_prompt += weather_context
            except:
                pass  # Continue without weather data if API fails

        # Generate content using Gemini API Key 2
        model = get_gemini_knowledge_client()

        # Add context for better responses
        context = """You are an expert agricultural advisor for Kerala, India. Provide detailed, practical, and location-specific advice. 
        Format your response in a clear, readable manner with proper paragraphs and bullet points where appropriate. 
        Include specific examples relevant to Kerala's climate, soil, and farming conditions."""

        full_prompt = f"{context}\n\n{enhanced_prompt}"

        response = model.generate_content(full_prompt)
        content = (
            response.text
            if response.text
            else "Unable to generate content at this moment."
        )

        return jsonify(
            {
                "success": True,
                "content": content,
                "category_id": category_id,
                "timestamp": datetime.now().isoformat(),
            }
        )

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@knowledge_bp.route("/market-prices", methods=["GET"])
def get_market_prices():
    """Get current market prices for major crops in Kerala using GROQ for lightweight AI tasks"""
    try:
        # Use GROQ for lightweight market price generation
        client = get_groq_client()

        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {
                    "role": "system",
                    "content": "You are a market price advisor for Kerala farmers. Generate realistic current market prices with trends.",
                },
                {
                    "role": "user",
                    "content": """Generate ONLY a JSON array of 6 major crop market prices in Kerala with this EXACT format:
[
  {"name": "Rice", "price": 45, "change": 2.5},
  {"name": "Coconut", "price": 35, "change": -1.2}
]

Include: Rice, Coconut, Rubber, Black Pepper, Cardamom, Banana
- price: current price per kg in rupees (realistic for Kerala)
- change: percentage change from last week (can be positive or negative)

Output ONLY the JSON array, no other text.""",
                },
            ],
            max_tokens=400,
            temperature=0.7,
        )

        content = response.choices[0].message.content.strip()

        # Extract JSON from response
        import json
        import re

        # Try to find JSON array in response
        json_match = re.search(r"\[.*\]", content, re.DOTALL)
        if json_match:
            market_data = json.loads(json_match.group())
        else:
            # Fallback data if parsing fails
            market_data = [
                {"name": "Rice", "price": 45, "change": 2.5},
                {"name": "Coconut", "price": 35, "change": -1.2},
                {"name": "Rubber", "price": 180, "change": 3.8},
                {"name": "Black Pepper", "price": 650, "change": 5.2},
                {"name": "Cardamom", "price": 1200, "change": -2.1},
                {"name": "Banana", "price": 30, "change": 1.5},
            ]

        return jsonify(
            {
                "success": True,
                "data": market_data,
                "timestamp": datetime.now().isoformat(),
                "powered_by": "GROQ",
            }
        )

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@knowledge_bp.route("/crop-calendar", methods=["GET"])
def get_crop_calendar():
    """Get crop calendar data using GROQ for lightweight AI generation"""
    try:
        client = get_groq_client()

        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {
                    "role": "system",
                    "content": "You are an agricultural expert for Kerala, India. Generate crop calendar information.",
                },
                {
                    "role": "user",
                    "content": """Generate ONLY a JSON array of 12 months crop calendar data for Kerala with this EXACT format:
[
  {
    "month": "January",
    "crops": ["Tomato", "Onion", "Cabbage", "Cauliflower"],
    "activities": ["Land preparation", "Sowing", "Irrigation"],
    "tips": "Perfect time for winter vegetables. Ensure proper drainage."
  }
]

Include all 12 months (January to December) with:
- 4-5 crops suitable for Kerala
- 3-4 key farming activities
- One practical tip (max 100 characters)

Output ONLY the JSON array, no other text.""",
                },
            ],
            max_tokens=2000,
            temperature=0.7,
        )

        content = response.choices[0].message.content.strip()

        # Extract JSON from response
        import json
        import re

        # Try to find JSON array in response
        json_match = re.search(r"\[.*\]", content, re.DOTALL)
        if json_match:
            calendar_data = json.loads(json_match.group())
        else:
            # Fallback data
            calendar_data = [
                {
                    "month": "January",
                    "crops": ["Tomato", "Onion", "Cabbage", "Cauliflower"],
                    "activities": ["Land preparation", "Sowing", "Irrigation"],
                    "tips": "Perfect time for winter vegetables. Ensure proper drainage.",
                }
            ]

        return jsonify(
            {
                "success": True,
                "data": calendar_data,
                "timestamp": datetime.now().isoformat(),
                "powered_by": "GROQ",
            }
        )

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@knowledge_bp.route("/farming-tips", methods=["GET"])
def get_farming_tips():
    """Get smart farming tips using GROQ for lightweight AI generation"""
    try:
        # Get current weather for context
        weather_data = get_current_weather("Kochi")
        weather_context = ""
        if weather_data:
            weather_context = f"Current weather: {weather_data['temperature']}°C, {weather_data['description']}, Humidity: {weather_data['humidity']}%"

        client = get_groq_client()

        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {
                    "role": "system",
                    "content": "You are a smart farming advisor for Kerala farmers. Provide practical, actionable tips.",
                },
                {
                    "role": "user",
                    "content": f"""Generate exactly 3 practical farming tips for Kerala farmers.
{weather_context}

Requirements:
- Each tip should be ONE complete sentence
- Focus on: water management, soil health, or seasonal planning
- Make tips actionable and specific to Kerala's climate
- Each tip should be 50-80 characters

Output format (plain text, one tip per line):
Use drip irrigation to save 30-50% water while improving crop yield.
Test soil pH regularly and add organic matter to improve structure.
Plan crop rotation based on seasonal weather for maximum yield.""",
                },
            ],
            max_tokens=300,
            temperature=0.8,
        )

        content = response.choices[0].message.content.strip()

        # Split into individual tips
        tips = [
            tip.strip()
            for tip in content.split("\n")
            if tip.strip() and not tip.strip().startswith("#")
        ]

        # Take only first 3 tips
        tips = tips[:3]

        # Fallback if not enough tips
        if len(tips) < 3:
            tips = [
                "Use drip irrigation to save 30-50% water while improving crop yield.",
                "Test soil pH regularly and add organic matter to improve soil structure.",
                "Plan crop rotation based on seasonal weather patterns for maximum yield.",
            ]

        return jsonify(
            {
                "success": True,
                "tips": tips,
                "timestamp": datetime.now().isoformat(),
                "powered_by": "GROQ",
            }
        )

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


def get_current_weather(city="Kochi"):
    """Get current weather data from OpenWeatherMap API using environment API key"""
    try:
        api_key = get_openweather_api_key()

        url = f"{OPENWEATHER_BASE_URL}/weather"
        params = {"q": city, "appid": api_key, "units": "metric"}

        response = requests.get(url, params=params, timeout=10)

        if response.status_code == 200:
            data = response.json()
            return {
                "temperature": data["main"]["temp"],
                "description": data["weather"][0]["description"],
                "humidity": data["main"]["humidity"],
                "wind_speed": data["wind"]["speed"],
            }
        else:
            return None
    except Exception as e:
        print(f"Weather API error: {e}")
        return None


@knowledge_bp.route("/weather-analysis", methods=["GET"])
def get_weather_analysis():
    """Get detailed weather analysis for farming using Gemini API Key 2"""
    try:
        weather_data = get_current_weather("Kochi")
        if not weather_data:
            return jsonify({"success": False, "error": "Weather data unavailable"}), 500

        model = get_gemini_knowledge_client()
        prompt = f"""Based on the current weather conditions in Kerala:
        - Temperature: {weather_data['temperature']}°C
        - Condition: {weather_data['description']}
        - Humidity: {weather_data['humidity']}%
        - Wind Speed: {weather_data['wind_speed']} m/s

        Provide detailed analysis for farmers including:
        1. Impact on current crops
        2. Farming activities recommended for today
        3. Irrigation needs
        4. Pest and disease risks
        5. Harvesting considerations
        6. Short-term weather preparation advice

        Format the response in clear sections with actionable advice."""

        response = model.generate_content(prompt)
        content = response.text if response.text else "Weather analysis unavailable"

        return jsonify(
            {
                "success": True,
                "weather_data": weather_data,
                "analysis": content,
                "timestamp": datetime.now().isoformat(),
            }
        )

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
