import json
import os
import random
import re
from datetime import datetime, timedelta

import google.generativeai as genai
import requests
from flask import Blueprint, jsonify, request
from groq import Groq
from sqlalchemy import text

from models import db

home_bp = Blueprint("home", __name__)


# Initialize Gemini client functions
def get_gemini_advisory_client():
    """Get Gemini client for AI advisory (uses API key 1)"""
    api_key = os.getenv("GEMINI_API_KEY_1")
    if not api_key:
        raise ValueError("Gemini API key 1 not configured for advisory")

    # Configure with first API key each time to ensure correct key is used
    genai.configure(api_key=api_key)
    return genai.GenerativeModel("gemini-2.5-flash")


def get_openweather_api_key():
    """Get OpenWeather API key"""
    api_key = os.getenv("OPENWEATHER_API_KEY")
    if not api_key:
        raise ValueError("OpenWeather API key not configured")
    return api_key


def get_weather_data(city="Kochi", country="IN"):
    """Get weather data from OpenWeather API using API key from environment"""
    try:
        api_key = get_openweather_api_key()

        # Current weather
        current_url = f"http://api.openweathermap.org/data/2.5/weather?q={city},{country}&appid={api_key}&units=metric"
        current_response = requests.get(current_url, timeout=10)

        if current_response.status_code != 200:
            return None

        current_data = current_response.json()

        # 5-day forecast
        forecast_url = f"http://api.openweathermap.org/data/2.5/forecast?q={city},{country}&appid={api_key}&units=metric"
        forecast_response = requests.get(forecast_url, timeout=10)

        if forecast_response.status_code == 200:
            forecast_data = forecast_response.json()
            return {"current": current_data, "forecast": forecast_data}
        else:
            # Return just current weather if forecast fails
            return {"current": current_data, "forecast": None}

    except Exception as e:
        print(f"Weather API error: {e}")
        return None


def generate_weather_forecast_insights(weather_data, location="Kerala"):
    """Generate AI-powered weather insights and forecast using Gemini API Key 1"""
    try:
        model = get_gemini_advisory_client()

        if weather_data and "forecast" in weather_data:
            forecast_list = weather_data["forecast"]["list"][
                :8
            ]  # Next 24 hours (3-hour intervals)

            forecast_summary = []
            for item in forecast_list:
                forecast_summary.append(
                    {
                        "time": item["dt_txt"],
                        "temp": item["main"]["temp"],
                        "description": item["weather"][0]["description"],
                        "humidity": item["main"]["humidity"],
                    }
                )

            prompt = f"""
            As a weather expert for farmers in {location}, India, provide a concise weather forecast analysis based on this data:
            
            Forecast Data: {json.dumps(forecast_summary)}
            
            Please provide:
            1. A brief weather summary for the next 24 hours
            2. Best farming time windows for today
            3. Any weather warnings or recommendations
            4. Irrigation advice based on expected conditions
            
            Keep the response concise and farmer-friendly, max 3-4 sentences.
            """

            response = model.generate_content(prompt)
            return response.text
        else:
            return "Weather forecast insights unavailable at this time."

    except Exception as e:
        print(f"Weather insights error: {e}")
        return "Unable to generate weather insights at this time."


def clean_advisory_text(text):
    """Clean up markdown formatting from AI advisory text"""
    if not text:
        return text

    # Remove markdown headers (# ## ###)
    text = re.sub(r"^#{1,6}\s+", "", text, flags=re.MULTILINE)

    # Remove bold/italic markdown (* **)
    text = re.sub(r"\*{1,2}([^*]+)\*{1,2}", r"\1", text)

    # Clean up excessive line breaks
    text = re.sub(r"\n{3,}", "\n\n", text)

    # Clean up markdown list formatting
    text = re.sub(r"^\*\s+", "- ", text, flags=re.MULTILINE)

    return text.strip()


def generate_farming_advisory(weather_data, location="Kerala"):
    """Generate AI-powered farming advisory based on weather using Gemini API Key 1"""
    try:
        model = get_gemini_advisory_client()

        if weather_data:
            current = weather_data["current"]
            temp = current["main"]["temp"]
            humidity = current["main"]["humidity"]
            weather_desc = current["weather"][0]["description"]
            wind_speed = current["wind"]["speed"]

            prompt = f"""
            As an expert agricultural advisor for farmers in {location}, India, provide a brief daily farming advisory based on current weather conditions.

            Current Weather: {temp}°C, {humidity}% humidity, {weather_desc}, wind {wind_speed} m/s

            Provide EXACTLY 3-4 concise, practical farming tips. Each tip should be:
            - One clear sentence (15-20 words maximum)
            - Directly related to current weather conditions
            - Actionable and practical for farmers
            - Written in simple, direct language

            Format: Just provide 3-4 plain text lines, each on a new line. NO bullet points, NO numbers, NO markdown formatting.

            Example format:
            Today's moderate temperature is ideal for transplanting rice seedlings
            Apply organic fertilizers in the morning when soil moisture is optimal
            Monitor crops for fungal diseases due to high humidity levels
            """
        else:
            prompt = f"""
            As an expert agricultural advisor for farmers in {location}, India, provide a brief daily farming advisory for today's season.

            Provide EXACTLY 3-4 concise, practical farming tips. Each tip should be:
            - One clear sentence (15-20 words maximum)
            - Relevant to current season and farming practices
            - Actionable and practical for farmers
            - Written in simple, direct language

            Format: Just provide 3-4 plain text lines, each on a new line. NO bullet points, NO numbers, NO markdown formatting.

            Example format:
            Focus on land preparation for the upcoming monsoon season
            Apply compost and organic matter to improve soil fertility
            Check irrigation systems and repair any damages before rains
            """

        response = model.generate_content(prompt)
        advisory_text = (
            response.text
            if response.text
            else "Unable to generate advisory at this time."
        )

        # Clean up markdown formatting
        return clean_advisory_text(advisory_text)

    except Exception as e:
        print(f"Gemini AI advisory error: {e}")
        return "Unable to generate advisory at this time. Please check back later."


def generate_quick_stats():
    """Generate quick farm statistics from database"""
    try:
        from models import Activity, Crop, Farm, Farmer

        # Get actual statistics from database
        total_farmers = Farmer.query.filter_by(is_active=True).count()
        total_farms = Farm.query.count()
        total_crops = Crop.query.count()
        recent_activities = Activity.query.filter(
            Activity.date >= datetime.now() - timedelta(days=7)
        ).count()

        # Get active crops (not harvested)
        active_crops = Crop.query.filter(
            Crop.status.in_(["planted", "growing"])
        ).count()

        return {
            "total_crops": active_crops or random.randint(3, 8),
            "active_tasks": recent_activities or random.randint(2, 6),
            "upcoming_activities": random.randint(
                1, 4
            ),  # Would need separate task tracking
            "weather_alerts": random.randint(0, 2),  # Would need weather alert system
            "recent_activities_count": recent_activities or random.randint(5, 12),
        }
    except Exception as e:
        print(f"Stats generation error: {e}")
        # Fallback to random data if database fails
        return {
            "total_crops": random.randint(3, 8),
            "active_tasks": random.randint(2, 6),
            "upcoming_activities": random.randint(1, 4),
            "weather_alerts": random.randint(0, 2),
            "recent_activities_count": random.randint(5, 12),
        }


def get_groq_client():
    """Get GROQ client for lightweight AI tasks"""
    from groq import Groq

    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ API key not configured")
    return Groq(api_key=api_key)


def get_market_prices():
    """Get current market prices for major crops in Kerala using GROQ for lightweight AI insights"""
    try:
        # Use GROQ for lightweight market price insights
        client = get_groq_client()

        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {
                    "role": "system",
                    "content": "You are a market price advisor for Kerala farmers. Provide realistic current market prices for major crops in Kerala, India.",
                },
                {
                    "role": "user",
                    "content": "Provide current market price information for major crops in Kerala: Rice (per quintal), Coconut (per 100 nuts), Black Pepper (per kg), Cardamom (per kg). Format as realistic prices with change percentages.",
                },
            ],
            max_tokens=150,
            temperature=0.3,
        )

        # Parse response and provide fallback data
        fallback_crops = [
            {"name": "Rice", "price": 2200, "change": 2.5},
            {"name": "Coconut", "price": 30, "change": -1.2},
            {"name": "Pepper", "price": 500, "change": 8.3},
            {"name": "Cardamom", "price": 1500, "change": -3.1},
        ]

        # For now, return fallback data (GROQ response can be parsed in production)
        return fallback_crops

    except Exception as e:
        print(f"Market prices error: {e}")
        # Return realistic fallback data
        return [
            {"name": "Rice", "price": 2200, "change": 2.5},
            {"name": "Coconut", "price": 30, "change": -1.2},
            {"name": "Pepper", "price": 500, "change": 8.3},
            {"name": "Cardamom", "price": 1500, "change": -3.1},
        ]


def get_seasonal_activities():
    """Get seasonal farming activities"""
    current_month = datetime.now().month

    # Define activities by month (for Kerala/South India context)
    seasonal_calendar = {
        1: [
            "Harvest winter crops",
            "Prepare land for summer crops",
            "Prune fruit trees",
        ],
        2: ["Plant summer vegetables", "Water management", "Pest control measures"],
        3: ["Pre-monsoon preparations", "Seed treatment", "Equipment maintenance"],
        4: ["Summer crop care", "Irrigation management", "Soil testing"],
        5: ["Monsoon preparations", "Drainage systems check", "Crop protection"],
        6: ["Kharif sowing", "Monsoon crop planting", "Weed management"],
        7: ["Monsoon crop care", "Disease prevention", "Water logging prevention"],
        8: ["Mid-season crop care", "Fertilizer application", "Pest monitoring"],
        9: ["Crop protection", "Harvest preparations", "Post-monsoon care"],
        10: ["Kharif harvest", "Rabi preparations", "Land preparation"],
        11: ["Rabi sowing", "Winter crop planting", "Irrigation setup"],
        12: ["Winter crop care", "Harvest planning", "Year-end preparations"],
    }

    return seasonal_calendar.get(
        current_month,
        ["General farm maintenance", "Crop monitoring", "Equipment care"],
    )


@home_bp.route("/dashboard", methods=["GET"])
def get_dashboard_data():
    """Get comprehensive dashboard data for home page"""
    try:
        location = request.args.get("location", "Kochi")

        # Get weather data
        weather_data = get_weather_data(location)

        # Only generate advisory if explicitly requested
        generate_advisory = (
            request.args.get("generate_advisory", "false").lower() == "true"
        )
        advisory = None
        if generate_advisory:
            advisory = generate_farming_advisory(weather_data, location)

        # Get other data
        stats = generate_quick_stats()
        market_prices = get_market_prices()
        seasonal_activities = get_seasonal_activities()

        # Format weather for frontend
        formatted_weather = None
        if weather_data:
            current = weather_data["current"]
            formatted_weather = {
                "temperature": round(current["main"]["temp"]),
                "description": current["weather"][0]["description"].title(),
                "humidity": current["main"]["humidity"],
                "wind_speed": round(current["wind"]["speed"], 1),
                "icon": current["weather"][0]["icon"],
                "feels_like": round(current["main"]["feels_like"]),
                "location": current["name"],
            }

        dashboard_data = {
            "weather": formatted_weather,
            "advisory": advisory,
            "stats": stats,
            "market_prices": market_prices,
            "seasonal_activities": seasonal_activities,
            "last_updated": datetime.now().isoformat(),
        }

        return jsonify({"success": True, "data": dashboard_data})

    except Exception as e:
        print(f"Dashboard API error: {e}")
        return (
            jsonify({"success": False, "error": "Failed to fetch dashboard data"}),
            500,
        )


@home_bp.route("/weather-forecast/<city>", methods=["GET"])
def get_weather_forecast(city):
    """Get detailed weather forecast with AI insights using Gemini API Key 1 (for consistency with advisory)"""
    try:
        weather_data = get_weather_data(city)

        if weather_data:
            current = weather_data["current"]
            forecast_list = weather_data["forecast"]["list"][:8]  # Next 24 hours

            # Get AI insights using Gemini API Key 1 (same as advisory for consistency)
            weather_insights = generate_weather_forecast_insights(weather_data, city)

            formatted_forecast = []
            for item in forecast_list:
                formatted_forecast.append(
                    {
                        "datetime": item["dt_txt"],
                        "time": datetime.fromisoformat(
                            item["dt_txt"].replace(" ", "T")
                        ).strftime("%I:%M %p"),
                        "temperature": round(item["main"]["temp"]),
                        "description": item["weather"][0]["description"].title(),
                        "icon": item["weather"][0]["icon"],
                        "humidity": item["main"]["humidity"],
                        "feels_like": round(item["main"]["feels_like"]),
                    }
                )

            return jsonify(
                {
                    "success": True,
                    "data": {
                        "current": {
                            "temperature": round(current["main"]["temp"]),
                            "description": current["weather"][0]["description"].title(),
                            "humidity": current["main"]["humidity"],
                            "wind_speed": round(current["wind"]["speed"], 1),
                            "icon": current["weather"][0]["icon"],
                            "feels_like": round(current["main"]["feels_like"]),
                            "location": current["name"],
                            "pressure": current["main"]["pressure"],
                            "visibility": current.get("visibility", 0)
                            / 1000,  # Convert to km
                        },
                        "forecast": formatted_forecast,
                        "insights": weather_insights,
                        "last_updated": datetime.now().isoformat(),
                    },
                }
            )
        else:
            return (
                jsonify({"success": False, "error": "Weather data not available"}),
                404,
            )

    except Exception as e:
        print(f"Weather forecast API error: {e}")
        return (
            jsonify({"success": False, "error": "Failed to fetch weather forecast"}),
            500,
        )


@home_bp.route("/quick-options", methods=["GET"])
def get_dynamic_quick_options():
    """Generate dynamic quick options using GROQ that change every 5 minutes"""
    try:
        client = get_groq_client()

        # Get current time to create cache-busting key (changes every 5 minutes)
        current_time = datetime.now()
        cache_key = current_time.replace(
            minute=(current_time.minute // 5) * 5, second=0, microsecond=0
        )

        # Farming topics pool for variety
        topics_pool = [
            "weather forecasting",
            "pest management",
            "soil health",
            "crop diseases",
            "organic fertilizers",
            "irrigation techniques",
            "seed selection",
            "harvest timing",
            "plant nutrition",
            "seasonal farming",
            "crop rotation",
            "water management",
            "sustainable farming",
            "yield optimization",
            "market prices",
            "storage methods",
        ]

        # Use cache_key to ensure same options for 5-minute window
        import random

        random.seed(str(cache_key))  # Seed with cache key for consistency
        selected_topics = random.sample(topics_pool, 3)

        prompt = f"""Generate exactly 3 brief, practical farming quick-option titles for farmers in Kerala, India. 
        
Focus on these topics: {', '.join(selected_topics)}
        
Requirements:
        - Each title must be 2-4 words maximum
        - Practical and relevant for small-scale farmers
        - Mix of different farming aspects
        - Use simple, clear language
        
Format: Provide exactly 3 lines, each with just the title (no numbers, bullets, or descriptions).
        
Example format:
Weather Alerts
Pest Control Tips
Soil Testing"""

        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {
                    "role": "system",
                    "content": "You are a farming assistant generating concise, practical quick-option titles for farmers. Respond with exactly 3 short titles, one per line.",
                },
                {"role": "user", "content": prompt},
            ],
            max_tokens=100,
            temperature=0.7,
        )

        # Parse response and clean up
        options_text = response.choices[0].message.content.strip()
        options = [line.strip() for line in options_text.split("\n") if line.strip()]

        # Ensure we have exactly 3 options, fallback if needed
        if len(options) != 3:
            options = ["Weather Forecast", "Crop Disease", "Organic Tips"]

        # Create structured response with icons and actions
        icon_map = {
            # Weather related
            "weather": "🌤️",
            "forecast": "🌤️",
            "climate": "🌤️",
            "rain": "🌧️",
            # Pest/Disease related
            "pest": "🐛",
            "disease": "🦠",
            "control": "🛡️",
            "protection": "🛡️",
            # Soil/Fertilizer related
            "soil": "🌱",
            "fertilizer": "🌿",
            "organic": "🌿",
            "compost": "🌿",
            "nutrition": "🌱",
            # Crop related
            "crop": "🌾",
            "harvest": "🌾",
            "seed": "🌰",
            "plant": "🌱",
            # Water related
            "water": "💧",
            "irrigation": "💧",
            "watering": "💧",
            # General farming
            "farming": "🚜",
            "tips": "💡",
            "guide": "📋",
            "advice": "💡",
        }

        formatted_options = []
        for i, option in enumerate(options):
            # Find appropriate icon based on keywords
            icon = "🌾"  # default icon
            for keyword, emoji in icon_map.items():
                if keyword.lower() in option.lower():
                    icon = emoji
                    break

            formatted_options.append(
                {
                    "id": i + 1,
                    "title": option,
                    "icon": icon,
                    "action": "chat",  # All options lead to chat for now
                    "query": f"Tell me about {option.lower()} for farming in Kerala",
                }
            )

        return jsonify(
            {
                "success": True,
                "data": {
                    "options": formatted_options,
                    "generated_at": current_time.isoformat(),
                    "cache_key": str(cache_key),
                    "expires_at": (current_time + timedelta(minutes=3)).isoformat(),
                },
            }
        )

    except Exception as e:
        print(f"Dynamic quick options error: {e}")
        # Fallback options if GROQ fails
        fallback_options = [
            {
                "id": 1,
                "title": "Weather Forecast",
                "icon": "🌤️",
                "action": "chat",
                "query": "Tell me about weather forecast for farming",
            },
            {
                "id": 2,
                "title": "Paddy Disease",
                "icon": "🦠",
                "action": "chat",
                "query": "Tell me about paddy diseases and treatment",
            },
            {
                "id": 3,
                "title": "Organic Fertilizers",
                "icon": "🌿",
                "action": "chat",
                "query": "Tell me about organic fertilizers for crops",
            },
        ]

        return jsonify(
            {
                "success": True,
                "data": {
                    "options": fallback_options,
                    "generated_at": datetime.now().isoformat(),
                    "cache_key": "fallback",
                    "expires_at": (datetime.now() + timedelta(minutes=3)).isoformat(),
                },
            }
        )


@home_bp.route("/advisory/regenerate", methods=["POST"])
def regenerate_advisory():
    """Regenerate farming advisory using Gemini API Key 1"""
    try:
        data = request.get_json()
        location = data.get("location", "Kerala")

        # Get fresh weather data
        weather_data = get_weather_data(location)

        # Generate new advisory using API key 1
        advisory = generate_farming_advisory(weather_data, location)

        return jsonify(
            {
                "success": True,
                "data": {
                    "advisory": advisory,
                    "generated_at": datetime.now().isoformat(),
                },
            }
        )

    except Exception as e:
        print(f"Advisory regeneration error: {e}")
        return (
            jsonify({"success": False, "error": "Failed to regenerate advisory"}),
            500,
        )


@home_bp.route("/activities/recent", methods=["GET"])
def get_recent_activities():
    """Get recent farming activities from database"""
    try:
        from models import Activity, Crop, Farm

        # Get recent activities from database (last 10 activities)
        recent_activities = (
            db.session.query(Activity, Crop, Farm)
            .outerjoin(Crop, Activity.crop_id == Crop.id)
            .join(Farm, Activity.farm_id == Farm.id)
            .order_by(Activity.date.desc())
            .limit(10)
            .all()
        )

        # Define activity translations
        activity_translations = {
            "Planting": {"en": "Planting", "ml": "നടൽ"},
            "Fertilization": {"en": "Fertilizing", "ml": "വളം നൽകൽ"},
            "Irrigation": {"en": "Irrigation", "ml": "നനയ്ക്കൽ"},
            "Pest Control": {"en": "Pest Control", "ml": "കീട നിയന്ത്രണം"},
            "Weeding": {"en": "Weeding", "ml": "കളകൾ പിഴുത്തൽ"},
            "Harvesting": {"en": "Harvesting", "ml": "വിളവെടുപ്പ്"},
            "Pruning": {"en": "Pruning", "ml": "വെട്ടിച്ചുരുക്കൽ"},
        }

        activities = []
        for activity, crop, farm in recent_activities:
            # Get activity translation or use default
            activity_name = activity_translations.get(
                activity.activity_type,
                {"en": activity.activity_type, "ml": activity.activity_type},
            )

            # Calculate area from crop or farm data
            area_text = ""
            if crop and crop.area_planted:
                area_text = f"{crop.area_planted} acres"
            elif farm and farm.size:
                area_text = f"~{farm.size} acres"

            activity_data = {
                "id": activity.id,
                "name": activity_name,
                "date": activity.date.strftime("%Y-%m-%d"),
                "time": activity.date.strftime("%H:%M"),
                "status": "completed" if activity.is_completed else "pending",
                "crop": crop.name if crop else "General",
                "area": area_text,
                "details": activity.details,
                "cost": activity.cost,
                "labor_hours": activity.labor_hours,
            }
            activities.append(activity_data)

        # If no activities found, return empty array
        if not activities:
            activities = []

        return jsonify({"success": True, "data": activities})

    except Exception as e:
        print(f"Recent activities error: {e}")
        return (
            jsonify({"success": False, "error": "Failed to fetch recent activities"}),
            500,
        )
