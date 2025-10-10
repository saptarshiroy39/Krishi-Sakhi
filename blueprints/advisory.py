import os

import google.generativeai as genai
from flask import Blueprint, jsonify

from models import Activity, Crop, Farm, Farmer

advisory_bp = Blueprint("advisory", __name__)


@advisory_bp.route("/advisory/farmer/<int:farmer_id>", methods=["GET"])
def get_advisory(farmer_id):
    """Get personalized farming advisory for a specific farmer"""
    try:
        farmer = Farmer.query.get(farmer_id)
        if not farmer:
            return jsonify({"error": "Farmer not found"}), 404

        farms = Farm.query.filter_by(farmer_id=farmer.id).all()
        if not farms:
            return jsonify({"error": "No farms found for this farmer"}), 404

        # Consolidate all the information to be sent to the model
        prompt = f"Provide personalized farming advice for {farmer.name}.\n"
        prompt += f"Farmer Information: {farmer.name}, Phone: {farmer.phone_number}\n"

        for farm in farms:
            prompt += f"\nFarm Information: Location - {farm.location}, Size - {farm.size} acres\n"

            crops = Crop.query.filter_by(farm_id=farm.id).all()
            if crops:
                prompt += "Crops:\n"
                for crop in crops:
                    prompt += f"- {crop.name}, Planted on {crop.planting_date}\n"

            activities = (
                Activity.query.filter_by(farm_id=farm.id)
                .order_by(Activity.date.desc())
                .limit(10)
                .all()
            )
            if activities:
                prompt += "Recent Activities:\n"
                for activity in activities:
                    prompt += f"- {activity.date.strftime('%Y-%m-%d')}: {activity.activity_type} - {activity.details}\n"

        # Use consistent API key naming (GEMINI_API_KEY_1 for main advisory)
        api_key = os.environ.get("GEMINI_API_KEY_1")
        if not api_key:
            return jsonify({"error": "Gemini API key not configured"}), 500

        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content(prompt)

        return jsonify({"advisory": response.text})

    except Exception as e:
        return jsonify({"error": f"Failed to generate advisory: {str(e)}"}), 500
