import json
import os
from datetime import datetime, timedelta

import google.generativeai as genai
from dotenv import load_dotenv
from flask import Blueprint, jsonify, request
from groq import Groq

load_dotenv()

schemes_bp = Blueprint("schemes", __name__)

# Configure Gemini API
GEMINI_API_KEY_2 = os.getenv("GEMINI_API_KEY_2")
genai.configure(api_key=GEMINI_API_KEY_2)

# Initialize GROQ client for lightweight tasks
def get_groq_client():
    """Get GROQ client for lightweight scheme analysis"""
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ API key not configured")
    return Groq(api_key=api_key)

# Government schemes data
SCHEMES_DATA = [
    {
        "id": 1,
        "name": {"en": "PM-KISAN Samman Nidhi", "ml": "പിഎം-കിസാൻ സമ്മാൻ നിധി"},
        "description": {
            "en": "Direct income support to all landholding farmers' families. ₹6,000 per year in three installments.",
            "ml": "എല്ലാ ഭൂവുടമസ്ഥ കർഷക കുടുംബങ്ങൾക്കും നേരിട്ടുള്ള വരുമാന പിന്തുണ. മൂന്ന് ഗഡുകളായി വർഷത്തിൽ ₹6,000.",
        },
        "tag": {"en": "Income Support", "ml": "വരുമാന പിന്തുണ"},
        "eligibility": {
            "en": "All landholding farmers (except those in excluded categories)",
            "ml": "എല്ലാ ഭൂവുടമസ്ഥ കർഷകർ (ഒഴിവാക്കപ്പെട്ട വിഭാഗങ്ങളിലുള്ളവർ ഒഴികെ)",
        },
        "documents": {
            "en": ["Aadhaar Card", "Bank Account Details", "Land Records"],
            "ml": ["ആധാർ കാർഡ്", "ബാങ്ക് അക്കൗണ്ട് വിവരങ്ങൾ", "ഭൂമി രേഖകൾ"],
        },
        "applicationProcess": {
            "en": "Apply online at pmkisan.gov.in or visit nearest Common Service Center",
            "ml": "pmkisan.gov.in-ൽ ഓൺലൈനായി അപേക്ഷിക്കുക അല്ലെങ്കിൽ അടുത്തുള്ള കോമൺ സർവീസ് സെന്റർ സന്ദർശിക്കുക",
        },
        "officialLink": "https://pmkisan.gov.in",
        "category": "income_support",
    },
    {
        "id": 2,
        "name": {
            "en": "Pradhan Mantri Fasal Bima Yojana",
            "ml": "പ്രധാനമന്ത്രി ഫസൽ ബീമ യോജന",
        },
        "description": {
            "en": "Crop insurance scheme providing financial support to farmers suffering crop loss/damage.",
            "ml": "വിള നഷ്ടം/കേടുപാടുകൾ അനുഭവിക്കുന്ന കർഷകർക്ക് സാമ്പത്തിക പിന്തുണ നൽകുന്ന വിള ഇൻഷുറൻസ് പദ്ധതി.",
        },
        "tag": {"en": "Insurance", "ml": "ഇൻഷുറൻസ്"},
        "eligibility": {
            "en": "All farmers growing notified crops in notified areas",
            "ml": "അറിയിപ്പ് പ്രദേശങ്ങളിൽ അറിയിപ്പ് വിളകൾ കൃഷി ചെയ്യുന്ന എല്ലാ കർഷകരും",
        },
        "documents": {
            "en": [
                "Aadhaar Card",
                "Bank Account Details",
                "Land Records",
                "Sowing Certificate",
            ],
            "ml": ["ആധാർ കാർഡ്", "ബാങ്ക് അക്കൗണ്ട് വിവരങ്ങൾ", "ഭൂമി രേഖകൾ", "വിത്ത് സർട്ടിഫിക്കറ്റ്"],
        },
        "applicationProcess": {
            "en": "Apply through banks, insurance companies, or online portal",
            "ml": "ബാങ്കുകൾ, ഇൻഷുറൻസ് കമ്പനികൾ അല്ലെങ്കിൽ ഓൺലൈൻ പോർട്ടൽ വഴി അപേക്ഷിക്കുക",
        },
        "officialLink": "https://pmfby.gov.in",
        "category": "insurance",
    },
    {
        "id": 3,
        "name": {"en": "Soil Health Card Scheme", "ml": "മണ്ണ് ആരോഗ്യ കാർഡ് പദ്ധതി"},
        "description": {
            "en": "Promotes soil testing and provides soil health cards to farmers for better crop planning.",
            "ml": "മണ്ണ് പരിശോധനയെ പ്രോത്സാഹിപ്പിക്കുകയും മികച്ച വിള ആസൂത്രണത്തിനായി കർഷകർക്ക് മണ്ണ് ആരോഗ്യ കാർഡുകൾ നൽകുകയും ചെയ്യുന്നു.",
        },
        "tag": {"en": "Soil Testing", "ml": "മണ്ണ് പരിശോധന"},
        "eligibility": {
            "en": "All farmers with agricultural land",
            "ml": "കാർഷിക ഭൂമിയുള്ള എല്ലാ കർഷകരും",
        },
        "documents": {
            "en": ["Land Records", "Aadhaar Card"],
            "ml": ["ഭൂമി രേഖകൾ", "ആധാർ കാർഡ്"],
        },
        "applicationProcess": {
            "en": "Contact local agricultural extension officer or soil testing laboratory",
            "ml": "പ്രാദേശിക കാർഷിക വിപുലീകരണ ഉദ്യോഗസ്ഥനെ അല്ലെങ്കിൽ മണ്ണ് പരിശോധന ലബോറട്ടറിയെ ബന്ധപ്പെടുക",
        },
        "officialLink": "https://soilhealth.dac.gov.in",
        "category": "soil_testing",
    },
    {
        "id": 4,
        "name": {"en": "PM Kisan Credit Card", "ml": "പിഎം കിസാൻ ക്രെഡിറ്റ് കാർഡ്"},
        "description": {
            "en": "Provides farmers with timely access to credit for their production needs.",
            "ml": "കർഷകർക്ക് അവരുടെ ഉൽപ്പാദന ആവശ്യങ്ങൾക്കായി സമയബന്ധിത വായ്പാ സൗകര്യം നൽകുന്നു.",
        },
        "tag": {"en": "Credit", "ml": "വായ്പ"},
        "eligibility": {
            "en": "Farmers with land ownership documents or tenant farmers",
            "ml": "ഭൂവുടമസ്ഥത്വ രേഖകളുള്ള കർഷകർ അല്ലെങ്കിൽ കുടിയാൻ കർഷകർ",
        },
        "documents": {
            "en": ["Aadhaar Card", "PAN Card", "Land Records", "Bank Account Details"],
            "ml": ["ആധാർ കാർഡ്", "പാൻ കാർഡ്", "ഭൂമി രേഖകൾ", "ബാങ്ക് അക്കൗണ്ട് വിവരങ്ങൾ"],
        },
        "applicationProcess": {
            "en": "Apply at any bank branch with required documents",
            "ml": "ആവശ്യമായ രേഖകളുമായി ഏതെങ്കിലും ബാങ്ക് ബ്രാഞ്ചിൽ അപേക്ഷിക്കുക",
        },
        "officialLink": "https://www.nabard.org/content1.aspx?id=1048&catid=23",
        "category": "credit",
    },
    {
        "id": 5,
        "name": {
            "en": "Rashtriya Krishi Vikas Yojana (RKVY)",
            "ml": "രാഷ്ട്രീയ കൃഷി വികാസ് യോജന",
        },
        "description": {
            "en": "Comprehensive development of agriculture and allied sectors through state-specific interventions.",
            "ml": "സംസ്ഥാന-നിർദ്ദിഷ്ട ഇടപെടലുകളിലൂടെ കൃഷിയുടെയും അനുബന്ധ മേഖലകളുടെയും സമഗ്ര വികസനം.",
        },
        "tag": {"en": "Development", "ml": "വികസനം"},
        "eligibility": {
            "en": "State governments and implementing agencies",
            "ml": "സംസ്ഥാന സർക്കാരുകളും നടപ്പാക്കൽ ഏജൻസികളും",
        },
        "documents": {
            "en": [
                "Project Proposal",
                "State Government Approval",
                "Implementation Plan",
            ],
            "ml": ["പ്രോജക്ട് പ്രൊപ്പോസൽ", "സംസ്ഥാന സർക്കാർ അനുമതി", "നടപ്പാക്കൽ പദ്ധതി"],
        },
        "applicationProcess": {
            "en": "Apply through state agriculture department or designated nodal agencies",
            "ml": "സംസ്ഥാന കാർഷിക വകുപ്പ് അല്ലെങ്കിൽ നിയുക്ത നോഡൽ ഏജൻസികൾ വഴി അപേക്ഷിക്കുക",
        },
        "officialLink": "https://rkvy.nic.in",
        "category": "development",
    },
    {
        "id": 6,
        "name": {
            "en": "National Mission for Sustainable Agriculture (NMSA)",
            "ml": "ദേശീയ സുസ്ഥിര കാർഷിക മിഷൻ",
        },
        "description": {
            "en": "Promotes sustainable agriculture practices through climate-resilient technologies and water conservation.",
            "ml": "കാലാവസ്ഥാ പ്രതിരോധ സാങ്കേതികവിദ്യകളും ജല സംരക്ഷണവും വഴി സുസ്ഥിര കാർഷിക രീതികൾ പ്രോത്സാഹിപ്പിക്കുന്നു.",
        },
        "tag": {"en": "Sustainability", "ml": "സുസ്ഥിരത"},
        "eligibility": {
            "en": "All farmers adopting sustainable practices",
            "ml": "സുസ്ഥിര രീതികൾ സ്വീകരിക്കുന്ന എല്ലാ കർഷകരും",
        },
        "documents": {
            "en": ["Aadhaar Card", "Land Records", "Sustainable Practice Certificate"],
            "ml": ["ആധാർ കാർഡ്", "ഭൂമി രേഖകൾ", "സുസ്ഥിര പ്രാക്ടീസ് സർട്ടിഫിക്കറ്റ്"],
        },
        "applicationProcess": {
            "en": "Contact local KVK or agricultural extension center",
            "ml": "പ്രാദേശിക കെവികെ അല്ലെങ്കിൽ കാർഷിക വിപുലീകരണ കേന്ദ്രം ബന്ധപ്പെടുക",
        },
        "officialLink": "https://nmsa.dac.gov.in",
        "category": "sustainability",
    },
]

# Default recommendations powered by Gemini API
DEFAULT_RECOMMENDATIONS_CACHE = {"last_updated": None, "recommendations": []}


def generate_default_recommendations():
    """Generate default recommendations using Gemini AI"""
    try:
        current_season = (
            "Monsoon"
            if datetime.now().month in [6, 7, 8, 9]
            else "Post-Monsoon" if datetime.now().month in [10, 11, 12] else "Summer"
        )

        prompt = f"""
        You are an expert agricultural advisor for Indian farmers. Generate top 3 government scheme recommendations for the current {current_season} season in 2025.
        
        Available schemes (by ID):
        1. PM-KISAN Samman Nidhi - Income Support
        2. Pradhan Mantri Fasal Bima Yojana - Crop Insurance
        3. Soil Health Card Scheme - Soil Testing
        4. PM Kisan Credit Card - Credit
        5. Rashtriya Krishi Vikas Yojana - Development
        6. National Mission for Sustainable Agriculture - Sustainability
        
        Consider:
        - Current season: {current_season}
        - General Indian farming patterns
        - Most beneficial schemes for this time of year
        - Mix of immediate and long-term benefits
        
        Respond in JSON format:
        {{
            "season": "{current_season}",
            "recommendations": [
                {{
                    "scheme_id": 1,
                    "priority": "High/Medium/Low",
                    "reason": "Why this scheme is recommended for this season",
                    "seasonal_benefit": "Specific benefit for current season",
                    "urgency": "How urgent this application is"
                }}
            ],
            "general_advice": "General farming advice for this season"
        }}
        """

        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content(prompt)

        try:
            ai_response = json.loads(response.text)
            return ai_response
        except:
            # Fallback recommendations
            return {
                "season": current_season,
                "recommendations": [
                    {
                        "scheme_id": 1,
                        "priority": "High",
                        "reason": "Universal income support helps during any season",
                        "seasonal_benefit": f"Additional income during {current_season} season",
                        "urgency": "Apply if not already enrolled",
                    },
                    {
                        "scheme_id": 2,
                        "priority": "High" if current_season == "Monsoon" else "Medium",
                        "reason": "Crop insurance is crucial for weather-dependent farming",
                        "seasonal_benefit": "Protection against seasonal crop losses",
                        "urgency": "High during monsoon season",
                    },
                ],
                "general_advice": f"Focus on {current_season.lower()} appropriate farming practices",
            }
    except Exception as e:
        print(f"Error generating recommendations: {e}")
        return None


@schemes_bp.route("/schemes/default-recommendations", methods=["GET"])
def get_default_recommendations():
    """Get default AI-powered scheme recommendations"""
    try:
        # Check if we need to update recommendations (every 24 hours)
        now = datetime.now()
        should_update = DEFAULT_RECOMMENDATIONS_CACHE[
            "last_updated"
        ] is None or now - DEFAULT_RECOMMENDATIONS_CACHE["last_updated"] > timedelta(
            hours=24
        )

        if should_update:
            ai_recommendations = generate_default_recommendations()
            if ai_recommendations:
                # Get full scheme details for recommended schemes
                recommended_schemes = []
                for rec in ai_recommendations.get("recommendations", []):
                    scheme = next(
                        (s for s in SCHEMES_DATA if s["id"] == rec["scheme_id"]), None
                    )
                    if scheme:
                        scheme_with_rec = scheme.copy()
                        scheme_with_rec["recommendation"] = rec
                        scheme_with_rec["last_updated"] = now.isoformat()
                        recommended_schemes.append(scheme_with_rec)

                DEFAULT_RECOMMENDATIONS_CACHE["recommendations"] = recommended_schemes
                DEFAULT_RECOMMENDATIONS_CACHE["last_updated"] = now
                DEFAULT_RECOMMENDATIONS_CACHE["season"] = ai_recommendations.get(
                    "season", "Current"
                )
                DEFAULT_RECOMMENDATIONS_CACHE["general_advice"] = (
                    ai_recommendations.get("general_advice", "")
                )

        return (
            jsonify(
                {
                    "success": True,
                    "data": {
                        "recommended_schemes": DEFAULT_RECOMMENDATIONS_CACHE[
                            "recommendations"
                        ],
                        "season": DEFAULT_RECOMMENDATIONS_CACHE.get(
                            "season", "Current"
                        ),
                        "general_advice": DEFAULT_RECOMMENDATIONS_CACHE.get(
                            "general_advice", ""
                        ),
                        "last_updated": (
                            DEFAULT_RECOMMENDATIONS_CACHE["last_updated"].isoformat()
                            if DEFAULT_RECOMMENDATIONS_CACHE["last_updated"]
                            else None
                        ),
                        "total_recommendations": len(
                            DEFAULT_RECOMMENDATIONS_CACHE["recommendations"]
                        ),
                    },
                }
            ),
            200,
        )

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@schemes_bp.route("/schemes", methods=["GET"])
def get_all_schemes():
    """Get all available schemes with timestamps"""
    try:
        # Add timestamps to schemes
        schemes_with_timestamps = []
        for scheme in SCHEMES_DATA:
            scheme_copy = scheme.copy()
            scheme_copy["last_updated"] = datetime.now().isoformat()
            schemes_with_timestamps.append(scheme_copy)

        return (
            jsonify(
                {
                    "success": True,
                    "data": schemes_with_timestamps,
                    "total": len(schemes_with_timestamps),
                    "last_fetched": datetime.now().isoformat(),
                }
            ),
            200,
        )
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@schemes_bp.route("/schemes/<int:scheme_id>", methods=["GET"])
def get_scheme_details(scheme_id):
    """Get detailed information about a specific scheme"""
    try:
        scheme = next((s for s in SCHEMES_DATA if s["id"] == scheme_id), None)
        if not scheme:
            return jsonify({"success": False, "error": "Scheme not found"}), 404

        return jsonify({"success": True, "data": scheme}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@schemes_bp.route("/schemes/recommend", methods=["POST"])
def recommend_schemes():
    """Recommend schemes based on farmer profile using Gemini AI"""
    try:
        data = request.get_json()

        # Extract farmer information
        farm_size = data.get("farmSize", "")
        crops = data.get("crops", [])
        location = data.get("location", "")
        farming_type = data.get("farmingType", "")
        annual_income = data.get("annualIncome", "")
        language = data.get("language", "en")

        # Create prompt for Gemini
        schemes_info = "\n".join(
            [
                f"Scheme {s['id']}: {s['name'][language]} - {s['description'][language]} (Category: {s['category']})"
                for s in SCHEMES_DATA
            ]
        )

        prompt = f"""
        You are an expert agricultural advisor. Based on the farmer's profile below, recommend the most suitable government schemes from the available options.

        Farmer Profile:
        - Farm Size: {farm_size}
        - Crops: {', '.join(crops) if crops else 'Not specified'}
        - Location: {location}
        - Farming Type: {farming_type}
        - Annual Income: {annual_income}

        Available Schemes:
        {schemes_info}

        Please provide:
        1. Top 3 most suitable schemes (by ID) with reasons
        2. Priority ranking (High/Medium/Low) for each
        3. Brief explanation of why each scheme is suitable
        4. Any additional advice

        Respond in {'Malayalam' if language == 'ml' else 'English'} language.
        Format your response as JSON with this structure:
        {{
            "recommendations": [
                {{
                    "scheme_id": 1,
                    "priority": "High",
                    "reason": "explanation here",
                    "potential_benefit": "benefit amount or description"
                }}
            ],
            "additional_advice": "general advice here"
        }}
        """

        # Generate response using Gemini
        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content(prompt)

        try:
            # Try to parse JSON response
            import json

            ai_response = json.loads(response.text)
        except:
            # Fallback if JSON parsing fails
            ai_response = {
                "recommendations": [
                    {
                        "scheme_id": 1,
                        "priority": "High",
                        "reason": "Universal income support suitable for all farmers",
                        "potential_benefit": "₹6,000 per year",
                    }
                ],
                "additional_advice": response.text,
            }

        # Get full scheme details for recommended schemes
        recommended_schemes = []
        for rec in ai_response.get("recommendations", []):
            scheme = next(
                (s for s in SCHEMES_DATA if s["id"] == rec["scheme_id"]), None
            )
            if scheme:
                scheme_with_rec = scheme.copy()
                scheme_with_rec["recommendation"] = rec
                recommended_schemes.append(scheme_with_rec)

        return (
            jsonify(
                {
                    "success": True,
                    "data": {
                        "recommended_schemes": recommended_schemes,
                        "additional_advice": ai_response.get("additional_advice", ""),
                        "total_recommendations": len(recommended_schemes),
                    },
                }
            ),
            200,
        )

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@schemes_bp.route("/schemes/eligibility-check", methods=["POST"])
def check_eligibility():
    """Check eligibility for specific schemes using AI"""
    try:
        data = request.get_json()
        scheme_id = data.get("scheme_id")
        farmer_details = data.get("farmer_details", {})
        language = data.get("language", "en")

        # Find the scheme
        scheme = next((s for s in SCHEMES_DATA if s["id"] == scheme_id), None)
        if not scheme:
            return jsonify({"success": False, "error": "Scheme not found"}), 404

        # Create prompt for eligibility check
        prompt = f"""
        You are an expert on Indian government agricultural schemes. 
        
        Scheme: {scheme['name'][language]}
        Eligibility Criteria: {scheme['eligibility'][language]}
        Required Documents: {', '.join(scheme['documents'][language])}
        
        Farmer Details:
        {', '.join([f"{k}: {v}" for k, v in farmer_details.items()])}
        
        Please analyze if this farmer is eligible for this scheme and provide:
        1. Eligibility status (Eligible/Not Eligible/Partially Eligible)
        2. Reasons for the decision
        3. Missing documents or requirements (if any)
        4. Next steps for application
        
        Respond in {'Malayalam' if language == 'ml' else 'English'}.
        Format as JSON:
        {{
            "eligible": true/false,
            "status": "Eligible/Not Eligible/Partially Eligible",
            "reasons": ["reason1", "reason2"],
            "missing_requirements": ["req1", "req2"],
            "next_steps": ["step1", "step2"]
        }}
        """

        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content(prompt)

        try:
            import json

            eligibility_result = json.loads(response.text)
        except:
            eligibility_result = {
                "eligible": True,
                "status": "Eligible",
                "reasons": ["Based on provided information"],
                "missing_requirements": [],
                "next_steps": [scheme["applicationProcess"][language]],
            }

        return (
            jsonify(
                {
                    "success": True,
                    "data": {"scheme": scheme, "eligibility": eligibility_result},
                }
            ),
            200,
        )

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@schemes_bp.route("/schemes/search", methods=["GET"])
def search_schemes():
    """Search schemes by query"""
    try:
        query = request.args.get("q", "").lower()
        category = request.args.get("category", "")
        language = request.args.get("language", "en")

        if not query and not category:
            return (
                jsonify(
                    {"success": True, "data": SCHEMES_DATA, "total": len(SCHEMES_DATA)}
                ),
                200,
            )

        filtered_schemes = []
        for scheme in SCHEMES_DATA:
            match = False

            # Search by query in name and description
            if query:
                if (
                    query in scheme["name"][language].lower()
                    or query in scheme["description"][language].lower()
                    or query in scheme["tag"][language].lower()
                ):
                    match = True

            # Filter by category
            if category and scheme["category"] == category:
                match = True

            if match or (not query and not category):
                filtered_schemes.append(scheme)

        return (
            jsonify(
                {
                    "success": True,
                    "data": filtered_schemes,
                    "total": len(filtered_schemes),
                }
            ),
            200,
        )

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@schemes_bp.route("/schemes/quick-match", methods=["POST"])
def quick_scheme_match():
    """Use GROQ for quick scheme matching based on farmer needs"""
    try:
        data = request.get_json()
        farmer_query = data.get("query", "")
        
        if not farmer_query:
            return jsonify({"success": False, "error": "Query is required"}), 400

        # Use GROQ for fast scheme matching
        client = get_groq_client()
        
        # Create a simplified scheme list for GROQ
        scheme_summary = []
        for scheme in SCHEMES_DATA:
            scheme_summary.append(f"ID:{scheme['id']} - {scheme['name']['en']} ({scheme['category']})")
        
        schemes_text = "; ".join(scheme_summary)
        
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {
                    "role": "system", 
                    "content": f"You are a quick scheme matcher. Given farmer needs, return only the top 2 most relevant scheme IDs from this list: {schemes_text}. Respond with just comma-separated IDs, e.g., '1,3'"
                },
                {"role": "user", "content": f"Farmer needs: {farmer_query}"}
            ],
            max_tokens=20,
            temperature=0.3
        )

        # Parse the response to get scheme IDs
        try:
            suggested_ids = [int(id.strip()) for id in response.choices[0].message.content.strip().split(',')]
            matched_schemes = [scheme for scheme in SCHEMES_DATA if scheme['id'] in suggested_ids]
        except:
            # Fallback to first 2 schemes if parsing fails
            matched_schemes = SCHEMES_DATA[:2]

        return jsonify({
            "success": True,
            "data": {
                "matched_schemes": matched_schemes,
                "query": farmer_query,
                "powered_by": "GROQ"
            }
        })

    except Exception as e:
        print(f"GROQ scheme matching error: {e}")
        # Fallback to basic matching
        return jsonify({
            "success": True,
            "data": {
                "matched_schemes": SCHEMES_DATA[:2],
                "query": farmer_query,
                "powered_by": "FALLBACK"
            }
        })
