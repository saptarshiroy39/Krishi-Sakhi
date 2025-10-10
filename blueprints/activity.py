from datetime import datetime

from flask import Blueprint, jsonify, request

from models import Activity, Crop, Farm, db

activity_bp = Blueprint("activity", __name__)


def log_activity_from_chat(farm_id, activity_type, details):
    """Logs an activity from the chat blueprint."""
    new_activity = Activity(
        farm_id=farm_id, activity_type=activity_type, details=details
    )
    db.session.add(new_activity)
    db.session.commit()
    return {"message": "Activity logged successfully"}


@activity_bp.route("/activity", methods=["GET"])
def get_all_activities():
    """Get all activities with farm and crop information"""
    try:
        activities = (
            db.session.query(Activity, Farm, Crop)
            .join(Farm, Activity.farm_id == Farm.id)
            .outerjoin(Crop, Activity.crop_id == Crop.id)
            .order_by(Activity.date.desc())
            .all()
        )

        # Define activity translations
        activity_translations = {
            "Planting": {"en": "Planting", "ml": "നടൽ"},
            "Fertilization": {"en": "Fertilizing", "ml": "വളം നൽകൽ"},
            "Irrigation": {"en": "Watering", "ml": "നീർ വിളകൽ"},
            "Pest Control": {"en": "Pest Control", "ml": "കീട നിയന്ത്രണം"},
            "Weeding": {"en": "Weeding", "ml": "കളകൾ പിഴുത്തൽ"},
            "Harvesting": {"en": "Harvesting", "ml": "വിളവെടുപ്പ്"},
            "Pruning": {"en": "Pruning", "ml": "വെട്ടിച്ചുരുക്കൽ"},
        }

        formatted_activities = []
        for activity, farm, crop in activities:
            # Get activity translation or use default
            activity_name = activity_translations.get(
                activity.activity_type,
                {"en": activity.activity_type, "ml": activity.activity_type},
            )

            # Format date to DD/MM/YYYY
            formatted_date = activity.date.strftime("%d/%m/%Y")

            formatted_activity = {
                "id": activity.id,
                "name": activity_name,
                "date": formatted_date,
                "status": "completed" if activity.is_completed else "pending",
                "description": {
                    "en": activity.details or f"{activity.activity_type} activity",
                    "ml": activity.details or f"{activity.activity_type} പ്രവർത്തനം",
                },
                "farm_name": farm.name or "Farm",
                "crop_name": crop.name if crop else None,
                "cost": activity.cost,
                "labor_hours": activity.labor_hours,
            }
            formatted_activities.append(formatted_activity)

        return jsonify({"success": True, "data": formatted_activities})

    except Exception as e:
        print(f"Error fetching activities: {e}")
        return jsonify({"success": False, "error": "Failed to fetch activities"}), 500


@activity_bp.route("/activity", methods=["POST"])
def create_activity():
    """Create a new activity"""
    try:
        data = request.get_json()

        # Parse date from DD/MM/YYYY format
        date_str = data.get("date")
        if date_str:
            date_obj = datetime.strptime(date_str, "%d/%m/%Y")
        else:
            date_obj = datetime.now()

        new_activity = Activity(
            farm_id=data["farm_id"],
            activity_type=data["activity_type"],
            date=date_obj,
            details=data.get("details"),
            cost=data.get("cost", 0),
            labor_hours=data.get("labor_hours", 0),
            crop_id=data.get("crop_id"),
            is_completed=data.get("status") == "completed",
        )

        db.session.add(new_activity)
        db.session.commit()

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Activity created successfully",
                    "id": new_activity.id,
                }
            ),
            201,
        )

    except Exception as e:
        print(f"Error creating activity: {e}")
        db.session.rollback()
        return jsonify({"success": False, "error": "Failed to create activity"}), 500


@activity_bp.route("/activity/<int:activity_id>", methods=["PUT"])
def update_activity(activity_id):
    """Update an existing activity"""
    try:
        activity = Activity.query.get_or_404(activity_id)
        data = request.get_json()

        # Update fields
        if "activity_type" in data:
            activity.activity_type = data["activity_type"]
        if "details" in data:
            activity.details = data["details"]
        if "date" in data:
            activity.date = datetime.strptime(data["date"], "%d/%m/%Y")
        if "status" in data:
            activity.is_completed = data["status"] == "completed"
        if "cost" in data:
            activity.cost = data["cost"]
        if "labor_hours" in data:
            activity.labor_hours = data["labor_hours"]

        db.session.commit()

        return jsonify({"success": True, "message": "Activity updated successfully"})

    except Exception as e:
        print(f"Error updating activity: {e}")
        db.session.rollback()
        return jsonify({"success": False, "error": "Failed to update activity"}), 500


@activity_bp.route("/activity/<int:activity_id>", methods=["DELETE"])
def delete_activity(activity_id):
    """Delete an activity"""
    try:
        activity = Activity.query.get_or_404(activity_id)
        db.session.delete(activity)
        db.session.commit()

        return jsonify({"success": True, "message": "Activity deleted successfully"})

    except Exception as e:
        print(f"Error deleting activity: {e}")
        db.session.rollback()
        return jsonify({"success": False, "error": "Failed to delete activity"}), 500


@activity_bp.route("/activity/farm/<int:farm_id>", methods=["GET"])
def get_activities_for_farm(farm_id):
    """Get activities for a specific farm"""
    try:
        activities = (
            Activity.query.filter_by(farm_id=farm_id)
            .order_by(Activity.date.desc())
            .all()
        )
        return jsonify(
            {"success": True, "data": [activity.to_dict() for activity in activities]}
        )
    except Exception as e:
        print(f"Error fetching farm activities: {e}")
        return (
            jsonify({"success": False, "error": "Failed to fetch farm activities"}),
            500,
        )
