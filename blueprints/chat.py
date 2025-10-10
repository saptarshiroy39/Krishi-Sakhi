import json
import os
import re

import google.generativeai as genai
import PIL.Image
import requests
from flask import Blueprint, jsonify, request
from groq import Groq

from blueprints.activity import log_activity_from_chat

chat_bp = Blueprint("chat", __name__)

# Initialize clients - will be initialized on first use
groq_client = None


def get_groq_client():
    """Get GROQ client with proper error handling"""
    global groq_client
    if groq_client is None:
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ API key not configured")
        groq_client = Groq(api_key=api_key)
    return groq_client


def get_gemini_chat_client():
    """Get Gemini client for main AI chat (uses API key 1 for heavy usage)"""
    api_key = os.getenv("GEMINI_API_KEY_1")
    if not api_key:
        raise ValueError("Gemini API key 1 not configured for chat")

    # Configure with first API key each time to ensure correct key is used
    genai.configure(api_key=api_key)
    return genai.GenerativeModel("gemini-2.5-flash")


def get_gemini_utils_client():
    """Get Gemini client for translation and utilities (uses API key 2)"""
    api_key = os.getenv("GEMINI_API_KEY_2")
    if not api_key:
        raise ValueError("Gemini API key 2 not configured for utilities")

    # Configure with second API key each time to ensure correct key is used
    genai.configure(api_key=api_key)
    return genai.GenerativeModel("gemini-2.5-flash")


def get_gemini_client():
    """Backward compatibility - defaults to chat client"""
    return get_gemini_chat_client()


def get_groq_summary(text, max_length=100):
    """Use GROQ for lightweight text summarization tasks"""
    try:
        client = get_groq_client()
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {
                    "role": "system",
                    "content": f"Summarize the following text in maximum {max_length} characters. Keep it concise and relevant for farmers.",
                },
                {"role": "user", "content": text},
            ],
            max_tokens=50,
            temperature=0.3,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"GROQ summarization error: {e}")
        return text[:max_length] + "..." if len(text) > max_length else text


def get_groq_classification(text, categories):
    """Use GROQ for lightweight text classification tasks"""
    try:
        client = get_groq_client()
        categories_str = ", ".join(categories)
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {
                    "role": "system",
                    "content": f"Classify the following text into one of these categories: {categories_str}. Respond with only the category name.",
                },
                {"role": "user", "content": text},
            ],
            max_tokens=10,
            temperature=0.1,
        )
        result = response.choices[0].message.content.strip()
        return result if result in categories else categories[0]
    except Exception as e:
        print(f"GROQ classification error: {e}")
        return categories[0] if categories else "unknown"


def enhance_with_emojis(text, language="en"):
    """Add contextual emojis to AI responses"""
    import re

    # Define emoji mappings for different contexts
    emoji_mappings = {
        # Crops and plants
        r"\b(rice|धान|നെല്ല്)\b": "🌾",
        r"\b(wheat|गेहूं|ഗോതമ്പ്)\b": "🌾",
        r"\b(corn|maize|मक्का|ചോളം)\b": "🌽",
        r"\b(tomato|टमाटर|തക്കാളി)\b": "🍅",
        r"\b(potato|आलू|ഉരുളക്കിഴങ്ങ്)\b": "🥔",
        r"\b(onion|प्याज|ഉള്ളി)\b": "🧅",
        r"\b(carrot|गाजर|കാരറ്റ്)\b": "🥕",
        r"\b(cucumber|खीरा|വെള്ളരിക്ക)\b": "🥒",
        r"\b(banana|केला|വാഴ)\b": "🍌",
        r"\b(mango|आम|മാങ്ങ)\b": "🥭",
        r"\b(coconut|नारियल|തേങ്ങ)\b": "🥥",
        r"\b(apple|सेब|ആപ്പിൾ)\b": "🍎",
        r"\b(orange|संतरा|ഓറഞ്ച്)\b": "🍊",
        r"\b(flower|फूल|പൂവ്)\b": "🌸",
        r"\b(seed|बीज|വിത്ത്)\b": "🌱",
        r"\b(plant|पौधा|ചെടി)\b": "🌱",
        r"\b(tree|पेड़|മരം)\b": "🌳",
        r"\b(leaf|leaves|पत्ता|ഇല)\b": "🍃",
        # Weather
        r"\b(rain|बारिश|മഴ)\b": "🌧️",
        r"\b(sun|धूप|സൂര്യൻ)\b": "☀️",
        r"\b(cloud|बादल|മേഘം)\b": "☁️",
        r"\b(wind|हवा|കാറ്റ്)\b": "💨",
        r"\b(storm|तूफान|കൊടുങ്കാറ്റ്)\b": "⛈️",
        r"\b(temperature|तापमान|താപനില)\b": "🌡️",
        # Farming activities
        r"\b(sowing|बुवाई|വിതയൽ)\b": "🌱",
        r"\b(harvest|फसल|വിളവ്)\b": "🌾",
        r"\b(irrigation|सिंचाई|ജലസേചനം)\b": "💧",
        r"\b(water|पानी|വെള്ളം)\b": "💧",
        r"\b(fertilizer|खाद|വള)\b": "💩",
        r"\b(pest|कीट|കീടം)\b": "🐛",
        r"\b(disease|बीमारी|രോഗം)\b": "🦠",
        r"\b(soil|मिट्टी|മണ്ണ്)\b": "🌍",
        r"\b(organic|जैविक|ജൈവിക)\b": "🌿",
        # Tools and equipment
        r"\b(tractor|ट्रैक्टर|ട്രാക്ടർ)\b": "🚜",
        r"\b(tool|औजार|ഉപകരണം)\b": "🛠️",
        r"\b(machine|मशीन|യന്ത്രം)\b": "⚙️",
        # Success and growth
        r"\b(growth|वृद्धि|വളർച്ച)\b": "📈",
        r"\b(success|सफलता|വിജയം)\b": "✅",
        r"\b(profit|लाभ|ലാഭം)\b": "💰",
        r"\b(market|बाजार|വിപണി)\b": "🏪",
        # Time and seasons
        r"\b(season|मौसम|സീസൺ)\b": "📅",
        r"\b(month|महीना|മാസം)\b": "📅",
        r"\b(summer|गर्मी|വേനൽ)\b": "☀️",
        r"\b(winter|सर्दी|ശൈത്യം)\b": "❄️",
        r"\b(monsoon|मानसून|മൺസൂൺ)\b": "🌧️",
    }

    # Apply emoji mappings
    enhanced_text = text
    for pattern, emoji in emoji_mappings.items():
        enhanced_text = re.sub(
            pattern, f"{emoji} \\g<0>", enhanced_text, flags=re.IGNORECASE
        )

    # Add greeting emojis at the start
    greeting_patterns = [
        r"^(hello|hi|hey|namaste|നമസ്കാരം)",
        r"^(good|നല്ല)",
        r"^(welcome|സ്വാഗതം)",
    ]

    for pattern in greeting_patterns:
        if re.search(pattern, enhanced_text, re.IGNORECASE):
            enhanced_text = "🙏 " + enhanced_text
            break

    # Add farming context emoji at the end if it's farming advice
    farming_keywords = ["crop", "farm", "cultivation", "agriculture", "കൃഷി", "കർഷക"]
    if any(keyword in enhanced_text.lower() for keyword in farming_keywords):
        if not enhanced_text.endswith("🌾") and not enhanced_text.endswith("🚜"):
            enhanced_text += " 🌾"

    return enhanced_text


def format_ai_response(response):
    """Format AI response for better readability with emoji numbers and bullet dots"""
    # Clean up the response
    formatted = response.strip()

    # Remove excessive line breaks (more than 2 consecutive newlines)
    formatted = re.sub(r"\n{3,}", "\n\n", formatted)

    # Remove trailing spaces from each line
    formatted = "\n".join(line.rstrip() for line in formatted.split("\n"))

    # Replace numbered lists with emoji numbers
    formatted = re.sub(r"\b1\.", "1️⃣", formatted)
    formatted = re.sub(r"\b2\.", "2️⃣", formatted)
    formatted = re.sub(r"\b3\.", "3️⃣", formatted)
    formatted = re.sub(r"\b4\.", "4️⃣", formatted)
    formatted = re.sub(r"\b5\.", "5️⃣", formatted)
    formatted = re.sub(r"\b6\.", "6️⃣", formatted)
    formatted = re.sub(r"\b7\.", "7️⃣", formatted)
    formatted = re.sub(r"\b8\.", "8️⃣", formatted)
    formatted = re.sub(r"\b9\.", "9️⃣", formatted)
    formatted = re.sub(r"\b0\.", "0️⃣", formatted)

    # Replace asterisks with bullet dots for lists
    formatted = re.sub(r"^\s*\*\s+", "• ", formatted, flags=re.MULTILINE)
    formatted = re.sub(r"\n\s*\*\s+", "\n• ", formatted)

    # Replace hyphens at start of lines with bullet dots
    formatted = re.sub(r"^\s*-\s+", "• ", formatted, flags=re.MULTILINE)
    formatted = re.sub(r"\n\s*-\s+", "\n• ", formatted)

    # Ensure proper spacing after periods only when needed
    formatted = re.sub(r"\.([A-Z])", r". \1", formatted)

    # Clean up any remaining excessive whitespace
    formatted = re.sub(r"[ \t]+", " ", formatted)

    return formatted.strip()


def get_fallback_response(message, language):
    """Get fallback response when API fails"""
    if language == "ml":
        return """🌾 **കൃഷി സഖി**

നിങ്ങളുടെ ചോദ്യത്തിന് നന്ദി! നിലവിൽ സാങ്കേതിക പ്രശ്നങ്ങൾ കാരണം വിശദമായ ഉത്തരം നൽകാൻ കഴിയുന്നില്ല.

**പൊതു കാർഷിക നുറുങ്ങുകൾ:**
• 🌱 വിത്ത് വിതയ്ക്കുന്നതിന് മുമ്പ് മണ്ണ് പരിശോധിക്കുക
• 💧 ജലസേചനം സമയത്ത് ചെയ്യുക
• 🦗 കീടങ്ങളെ പതിവായി നിരീക്ഷിക്കുക
• 📝 കാർഷിക പ്രവർത്തനങ്ങൾ രേഖപ്പെടുത്തുക

ദയവായി പിന്നീട് വീണ്ടും ശ്രമിക്കുക! 🤝"""

    return """🌾 **Hello Farmer!** 👋

Thank you for your question! I'm currently experiencing technical difficulties and cannot provide a detailed response.

**General Farming Tips:**
• 🌱 Test soil before sowing
• 💧 Water at appropriate times
• 🦗 Monitor pests regularly
• 📝 Keep records of farming activities

Please try again later! 🤝"""


@chat_bp.route("/chat", methods=["POST"])
def chat():
    message = request.json.get("message")
    if not message:
        return jsonify({"error": "Please provide a message"}), 400

    # Check if message is asking about weather
    weather_keywords = [
        "weather",
        "temperature",
        "rain",
        "forecast",
        "കാലാവസ്ഥ",
        "താപനില",
        "മഴ",
    ]
    is_weather_query = any(keyword in message.lower() for keyword in weather_keywords)

    # Get weather data if it's a weather-related query
    weather_context = ""
    if is_weather_query:
        try:
            from blueprints.home import get_weather_data

            weather_data = get_weather_data("Kochi")
            if weather_data and "current" in weather_data:
                current = weather_data["current"]
                weather_context = f"\n\nCurrent Weather Data for Kochi:\n- Temperature: {current['main']['temp']}°C\n- Feels like: {current['main']['feels_like']}°C\n- Condition: {current['weather'][0]['description']}\n- Humidity: {current['main']['humidity']}%\n- Wind Speed: {current['wind']['speed']} m/s\n\nPlease use this real-time weather data to answer the user's question."
        except Exception as e:
            print(f"Error fetching weather data for chat: {e}")

    # Detect language and create appropriate system prompt
    def detect_language(text):
        # Simple language detection based on character patterns
        malayalam_chars = set("അആഇഈഉഊഋഎഏഐഒഓഔകഖഗഘങചഛജഝഞടഠഡഢണതഥദധനപഫബഭമയരലവശഷസഹളഴറ")
        text_chars = set(text)
        if malayalam_chars.intersection(text_chars):
            return "ml"
        return "en"

    user_language = detect_language(message)

    if user_language == "ml":
        system_prompt = """നിങ്ങൾ കൃഷി സഖി ആണ്, കൃഷി, വിള പരിപാലനം, കാർഷിക രീതികൾ എന്നിവയിൽ വിദഗ്ധനായ ഒരു AI കാർഷിക സഹായി. നിങ്ങൾ കർഷകർക്ക് സഹായകരവും കൃത്യവും പ്രായോഗികവുമായ ഉപദേശങ്ങൾ മലയാളത്തിൽ നൽകുന്നു. 

**IMPORTANT: Keep responses short, simple, and practical. Maximum 3-4 sentences or 3-5 bullet points. Always include relevant emojis.**

നിങ്ങളുടെ വൈദഗ്ധ്യം ഉൾപ്പെടുന്നു:

1️⃣ വിള കൃഷിയും പരിപാലനവും
2️⃣ കീടങ്ങളുടെയും രോഗങ്ങളുടെയും തിരിച്ചറിയലും ചികിത്സയും
3️⃣ കാലാവസ്ഥാധിഷ്ഠിത കാർഷിക ഉപദേശം
4️⃣ മണ്ണിന്റെ ആരോഗ്യവും വള ശുപാർശകളും
5️⃣ ജൈവകൃഷി രീതികൾ

എല്ലായ്പ്പോഴും പ്രായോഗികവും പ്രവർത്തനക്ഷമവുമായ ഉപദേശം നൽകുക. വിതയൽ, ജലസേചനം, കീടനിയന്ത്രണം, വള പ്രയോഗം തുടങ്ങിയ പ്രവർത്തനങ്ങളെക്കുറിച്ച് ചോദിച്ചാൽ, മികച്ച ഫാം മാനേജ്മെന്റിനായി കർഷകൻ ഈ പ്രവർത്തനങ്ങൾ രേഖപ്പെടുത്താൻ പരിഗണിക്കണമെന്ന് സൂചിപ്പിക്കുക.

ഒരു കർഷക സുഹൃത്തിനെ സഹായിക്കുന്ന അറിവുള്ള കാർഷിക വിദഗ്ധനെപ്പോലെ സൗഹൃദപരവും പിന്തുണാത്മകവുമായ രീതിയിൽ മറുപടി നൽകുക. എല്ലാ ഉത്തരങ്ങളും മലയാളത്തിൽ മാത്രം നൽകുക.

**ഫോർമാറ്റിംഗ് നിയമങ്ങൾ:**
• ചെറിയ ഖണ്ഡികകൾ മാത്രം ഉപയോഗിക്കുക (3-4 വാക്യങ്ങൾ)
• ഘട്ടം ഘട്ടമായുള്ള നിർദ്ദേശങ്ങൾക്കായി emoji അക്കങ്ങൾ (1️⃣, 2️⃣, 3️⃣) ഉപയോഗിക്കുക
• ഇനങ്ങൾ ലിസ്റ്റ് ചെയ്യാൻ bullet dots (•) ഉപയോഗിക്കുക, asterisks (*) അല്ല
• പ്രധാനപ്പെട്ട കാര്യങ്ങൾക്കായി **ബോൾഡ് ടെക്സ്റ്റ്** ഉപയോഗിക്കുക
• ഉത്തരങ്ങൾ ചുരുക്കവും വ്യക്തവുമായി നിലനിർത്തുക
• വളരെ ദീർഘമായ വിശദീകരണങ്ങൾ ഒഴിവാക്കുക"""
    else:
        system_prompt = """You are Krishi Sakhi, an AI farming assistant specialized in agriculture, crop management, and farming practices. You provide helpful, accurate, and practical advice to farmers in English. 

**IMPORTANT: Keep responses short, simple, and practical. Maximum 3-4 sentences or 3-5 bullet points. Always include relevant emojis.**

Your expertise includes:

1️⃣ Crop cultivation and management
2️⃣ Pest and disease identification and treatment
3️⃣ Weather-based farming advice
4️⃣ Soil health and fertilizer recommendations
5️⃣ Organic farming practices

Always provide practical, actionable advice. If asked about activities that should be logged (like sowing, irrigation, pest control, fertilizer application), mention that the farmer should consider logging these activities for better farm management.

Respond in a friendly, supportive manner as if you're a knowledgeable farming expert helping a fellow farmer. Always respond in English only.

**Formatting Rules:**
• Use short paragraphs only (3-4 sentences max)
• Use emoji numbers (1️⃣, 2️⃣, 3️⃣) for step-by-step instructions
• Use bullet dots (•) for listing items, NOT asterisks (*)
• Use **bold text** for important points or warnings
• Keep responses concise and well-organized
• Avoid overly long explanations"""

    try:
        # Use dedicated Gemini chat client for main AI conversations (API key 1)
        model = get_gemini_chat_client()

        # Create the conversation context with weather data if available
        full_prompt = f"{system_prompt}{weather_context}\n\nUser: {message}"

        # Generate response using Gemini
        response = model.generate_content(
            full_prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.7,
                max_output_tokens=800,  # Reduced from 1500 to keep responses shorter
                top_p=0.9,
            ),
        )

        ai_response = response.text

        # Enhance response with contextual emojis
        enhanced_response = enhance_with_emojis(ai_response, user_language)

        # Format the response for better readability
        formatted_response = format_ai_response(enhanced_response)

        # Log activity if mentioned
        activity_keywords = [
            "sowing",
            "irrigation",
            "pest control",
            "fertilizer",
            "harvesting",
            "planting",
            "watering",
            "വിതയൽ",
            "ജലസേചനം",
        ]
        if any(keyword in message.lower() for keyword in activity_keywords):
            try:
                log_activity_from_chat(message, formatted_response)
            except Exception as log_error:
                print(f"Activity logging failed: {log_error}")

        return jsonify({"response": formatted_response})

    except Exception as e:
        print(f"Gemini API error: {str(e)}")
        # Fallback response with proper formatting
        fallback_response = get_fallback_response(message, user_language)
        return jsonify({"response": fallback_response})


@chat_bp.route("/chat/translate", methods=["POST"])
@chat_bp.route("/translate", methods=["POST"])  # Backward compatibility
def translate_text():
    """Translate text between English and Malayalam"""
    data = request.get_json()
    text = data.get("text")
    from_lang = data.get("from", "en")
    to_lang = data.get("to", "ml")

    if not text:
        return jsonify({"error": "Text is required"}), 400

    try:
        # Use Gemini for high-quality translation with agricultural context
        if to_lang == "ml":
            system_prompt = """You are a professional agricultural translator specializing in farming terminology. Translate the following English text to Malayalam accurately while maintaining the meaning and context. 

IMPORTANT AGRICULTURAL TERMS:
- Paddy = നെൽ (not പരുത്തി which is cotton)
- Rice = അരി/നെല്ല് 
- Crop = വിള
- Disease = രോഗം
- Pest = കീടം
- Fertilizer = വള
- Irrigation = ജലസേചനം
- Farmer = കർഷകൻ
- Soil = മണ്ണ്
- Seed = വിത്ത്
- Water = വെള്ളം
- Plant = ചെടി
- Harvest = വിളവെടുപ്പ്
- Sowing = വിതയൽ

Preserve all emojis, formatting, bullet points, and structure exactly as in the original. Provide only the translation without any additional text."""
        else:
            system_prompt = """You are a professional agricultural translator specializing in farming terminology. Translate the following Malayalam text to English accurately while maintaining the meaning and context. 

IMPORTANT AGRICULTURAL TERMS:
- നെൽ = Paddy/Rice
- വിള = Crop
- രോഗം = Disease
- കീടം = Pest
- വള = Fertilizer
- ജലസേചനം = Irrigation
- കർഷകൻ = Farmer
- മണ്ണ് = Soil
- വിത്ത് = Seed
- വെള്ളം = Water
- ചെടി = Plant
- വിളവെടുപ്പ് = Harvest
- വിതയൽ = Sowing

Preserve all emojis, formatting, bullet points, and structure exactly as in the original. Provide only the translation without any additional text."""

        # Use dedicated Gemini utilities client for translation (API key 2)
        model = get_gemini_utils_client()

        # Create the full prompt
        full_prompt = f"{system_prompt}\n\nText to translate:\n{text}"

        response = model.generate_content(
            full_prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.1,
                max_output_tokens=2000,
            ),
        )

        translated_text = response.text.strip()

        return jsonify({"translatedText": translated_text})

    except Exception as e:
        print(f"Translation error: {str(e)}")
        # Fallback translation
        if to_lang == "ml":
            fallback = "Sorry, translation service is currently unavailable. / ക്ഷമിക്കണം, വിവർത്തന സേവനം നിലവിൽ ലഭ്യമല്ല."
        else:
            fallback = "ക്ഷമിക്കണം, വിവർത്തന സേവനം നിലവിൽ ലഭ്യമല്ല. / Sorry, translation service is currently unavailable."

        return jsonify({"translatedText": fallback})


@chat_bp.route("/chat/image", methods=["POST"])
def chat_with_image():
    """Handle image upload and analysis using Gemini Vision"""
    if "image" not in request.files:
        return jsonify({"error": "No image provided"}), 400

    file = request.files["image"]
    message = request.form.get(
        "message",
        "Please analyze this farming image and provide relevant agricultural advice.",
    )

    if file.filename == "":
        return jsonify({"error": "No image selected"}), 400

    try:
        # Read the image file
        import PIL.Image

        image = PIL.Image.open(file.stream)

        # Use dedicated Gemini utilities client for image analysis (API key 2)
        model = get_gemini_utils_client()

        # Agricultural image analysis prompt
        vision_prompt = f"""You are Krishi Sakhi, an expert agricultural AI assistant. Analyze this farming-related image and provide detailed, practical advice.

User's question/context: {message}

Please analyze the image and provide:
1. What you can observe in the image (crops, diseases, pests, soil conditions, equipment, etc.)
2. Agricultural assessment and diagnosis if applicable
3. Specific recommendations and actionable advice
4. Any warnings or concerns if you notice problems
5. Follow-up suggestions for better farming practices

**IMPORTANT: Include relevant farming emojis (🌾🚜🌱💧🐛🦋🌿🌞⚠️) throughout your response to make it engaging.**

Respond in a helpful, expert manner as if you're advising a fellow farmer. Be specific and practical in your recommendations."""

        # Generate response with image analysis
        response = model.generate_content([vision_prompt, image])

        # Format and enhance the response
        ai_response = response.text
        enhanced_response = enhance_with_emojis(ai_response, "en")
        formatted_response = format_ai_response(enhanced_response)

        return jsonify({"response": formatted_response})

    except Exception as e:
        print(f"Gemini Vision API error: {str(e)}")
        # Fallback response
        fallback_response = f"I can see you've uploaded an image: {file.filename}. While I'm having trouble analyzing the image right now, please describe what you see and I'll provide detailed farming advice based on your description. 🌾"
        return jsonify({"response": fallback_response})


@chat_bp.route("/tts", methods=["POST"])
def text_to_speech():
    """Convert text to speech"""
    try:
        import io

        from gtts import gTTS

        data = request.json
        text = data.get("text")
        language = data.get("language", "en")

        if not text:
            return jsonify({"error": "No text provided"}), 400

        # Clean text for better TTS
        # Remove emojis and special characters that might cause issues
        import re

        clean_text = re.sub(
            r"[\U0001F600-\U0001F64F\U0001F300-\U0001F5FF\U0001F680-\U0001F6FF\U0001F1E0-\U0001F1FF\u2600-\u26FF\u2700-\u27BF]",
            "",
            text,
        )
        clean_text = re.sub(r"[•◦▪▫‣⁃]", "", clean_text)  # Remove bullet points
        clean_text = re.sub(r"[1-9]️⃣|0️⃣", "", clean_text)  # Remove emoji numbers
        clean_text = re.sub(
            r"\*\*([^*]+)\*\*", r"\1", clean_text
        )  # Remove bold formatting
        clean_text = clean_text.strip()

        if not clean_text:
            return jsonify({"error": "No readable text found"}), 400

        # Map language codes for gTTS
        lang_map = {
            "en": "en",
            "ml": "hi",  # Use Hindi for Malayalam as it handles Devanagari/similar scripts better
        }

        tts_lang = lang_map.get(language, "en")

        # For Malayalam, try to use English if the text contains mostly English words
        if language == "ml":
            # Simple check: if text has more English characters than Malayalam
            english_chars = len(re.findall(r"[a-zA-Z]", clean_text))
            malayalam_chars = len(re.findall(r"[\u0D00-\u0D7F]", clean_text))

            if english_chars > malayalam_chars:
                tts_lang = "en"

        # Create TTS with error handling
        try:
            tts = gTTS(text=clean_text, lang=tts_lang, slow=False)
        except Exception as tts_error:
            # Fallback to English if the selected language fails
            print(f"TTS error with {tts_lang}: {tts_error}")
            tts = gTTS(text=clean_text, lang="en", slow=False)

        # Save to memory buffer
        audio_buffer = io.BytesIO()
        tts.write_to_fp(audio_buffer)
        audio_buffer.seek(0)

        # Return audio file
        from flask import send_file

        return send_file(
            audio_buffer,
            mimetype="audio/mpeg",
            as_attachment=False,
            download_name="speech.mp3",
        )

    except ImportError:
        return (
            jsonify(
                {
                    "error": "gTTS library not installed. Please install with: pip install gtts"
                }
            ),
            500,
        )
    except Exception as e:
        print(f"TTS error: {str(e)}")
        return jsonify({"error": f"TTS service unavailable: {str(e)}"}), 500


@chat_bp.route("/test-api-keys", methods=["GET"])
def test_api_keys():
    """Test both Gemini API keys"""
    results = {"api_key_1": "Not tested", "api_key_2": "Not tested"}

    try:
        # Test API key 1 (chat)
        chat_model = get_gemini_chat_client()
        chat_response = chat_model.generate_content(
            "Hello, respond with 'API Key 1 working'"
        )
        results["api_key_1"] = chat_response.text.strip()
    except Exception as e:
        results["api_key_1"] = f"Error: {str(e)}"

    try:
        # Test API key 2 (utilities)
        utils_model = get_gemini_utils_client()
        utils_response = utils_model.generate_content(
            "Hello, respond with 'API Key 2 working'"
        )
        results["api_key_2"] = utils_response.text.strip()
    except Exception as e:
        results["api_key_2"] = f"Error: {str(e)}"

    return jsonify(results)


@chat_bp.route("/quick-query", methods=["POST"])
def quick_query():
    """Handle lightweight AI queries using GROQ for faster responses"""
    try:
        data = request.get_json()
        query = data.get("query")
        task_type = data.get("type", "general")  # general, summary, classify

        if not query:
            return jsonify({"error": "Query is required"}), 400

        # Use GROQ for lightweight, fast responses
        client = get_groq_client()

        # Customize system prompt based on task type
        if task_type == "summary":
            system_prompt = "You are a concise agricultural assistant. Provide brief, practical summaries for farmers. Keep responses under 150 words."
        elif task_type == "classify":
            categories = data.get(
                "categories", ["general", "pest", "disease", "weather", "fertilizer"]
            )
            return jsonify(
                {"classification": get_groq_classification(query, categories)}
            )
        else:
            system_prompt = "You are a helpful agricultural assistant. Provide quick, practical answers for farmers. Keep responses concise but helpful."

        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": query},
            ],
            max_tokens=200,
            temperature=0.7,
        )

        ai_response = response.choices[0].message.content.strip()

        # Add emojis for better user experience
        enhanced_response = enhance_with_emojis(ai_response, "en")

        return jsonify(
            {"response": enhanced_response, "type": task_type, "powered_by": "GROQ"}
        )

    except Exception as e:
        print(f"GROQ quick query error: {str(e)}")
        return (
            jsonify(
                {
                    "error": "Unable to process quick query at this time",
                    "fallback": "Please try the main chat for detailed assistance",
                }
            ),
            500,
        )
