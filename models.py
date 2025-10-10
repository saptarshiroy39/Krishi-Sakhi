from datetime import datetime

from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import Boolean, Date, DateTime, Float, Integer, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, JSON

db = SQLAlchemy()


class Farmer(db.Model):
    __tablename__ = "farmers"

    id = db.Column(Integer, primary_key=True, autoincrement=True)
    name = db.Column(String(100), nullable=False, index=True)
    phone_number = db.Column(String(20), unique=True, nullable=False, index=True)
    email = db.Column(String(120), unique=True, nullable=True, index=True)
    address = db.Column(Text, nullable=True)
    date_created = db.Column(DateTime, nullable=False, default=datetime.utcnow)
    is_active = db.Column(Boolean, default=True)

    # Relationships
    farms = db.relationship(
        "Farm", backref="farmer", lazy=True, cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<Farmer {self.name}>"

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "phone_number": self.phone_number,
            "email": self.email,
            "address": self.address,
            "date_created": (
                self.date_created.isoformat() if self.date_created else None
            ),
            "is_active": self.is_active,
        }


class Farm(db.Model):
    __tablename__ = "farms"

    id = db.Column(Integer, primary_key=True, autoincrement=True)
    farmer_id = db.Column(
        Integer, db.ForeignKey("farmers.id"), nullable=False, index=True
    )
    name = db.Column(String(100), nullable=True)
    size = db.Column(Float, nullable=False)  # in acres
    location = db.Column(String(200), nullable=False, index=True)
    latitude = db.Column(Float, nullable=True)
    longitude = db.Column(Float, nullable=True)
    soil_type = db.Column(String(50), nullable=True)
    irrigation_type = db.Column(String(50), nullable=True)
    date_created = db.Column(DateTime, nullable=False, default=datetime.utcnow)
    is_active = db.Column(Boolean, default=True)

    # Relationships
    crops = db.relationship(
        "Crop", backref="farm", lazy=True, cascade="all, delete-orphan"
    )
    livestock = db.relationship(
        "Livestock", backref="farm", lazy=True, cascade="all, delete-orphan"
    )
    activities = db.relationship(
        "Activity", backref="farm", lazy=True, cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<Farm {self.name or self.id} - {self.location}>"

    def to_dict(self):
        return {
            "id": self.id,
            "farmer_id": self.farmer_id,
            "name": self.name,
            "size": self.size,
            "location": self.location,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "soil_type": self.soil_type,
            "irrigation_type": self.irrigation_type,
            "date_created": (
                self.date_created.isoformat() if self.date_created else None
            ),
            "is_active": self.is_active,
        }


class Crop(db.Model):
    __tablename__ = "crops"

    id = db.Column(Integer, primary_key=True, autoincrement=True)
    farm_id = db.Column(Integer, db.ForeignKey("farms.id"), nullable=False, index=True)
    name = db.Column(String(100), nullable=False, index=True)
    variety = db.Column(String(100), nullable=True)
    planting_date = db.Column(Date, nullable=False)
    expected_harvest_date = db.Column(Date, nullable=True)
    actual_harvest_date = db.Column(Date, nullable=True)
    area_planted = db.Column(Float, nullable=True)  # in acres
    expected_yield = db.Column(Float, nullable=True)  # in kg
    actual_yield = db.Column(Float, nullable=True)  # in kg
    status = db.Column(
        String(20), default="planted"
    )  # planted, growing, harvested, failed
    notes = db.Column(Text, nullable=True)
    date_created = db.Column(DateTime, nullable=False, default=datetime.utcnow)

    def __repr__(self):
        return f"<Crop {self.name} - {self.variety}>"

    def to_dict(self):
        return {
            "id": self.id,
            "farm_id": self.farm_id,
            "name": self.name,
            "variety": self.variety,
            "planting_date": (
                self.planting_date.isoformat() if self.planting_date else None
            ),
            "expected_harvest_date": (
                self.expected_harvest_date.isoformat()
                if self.expected_harvest_date
                else None
            ),
            "actual_harvest_date": (
                self.actual_harvest_date.isoformat()
                if self.actual_harvest_date
                else None
            ),
            "area_planted": self.area_planted,
            "expected_yield": self.expected_yield,
            "actual_yield": self.actual_yield,
            "status": self.status,
            "notes": self.notes,
            "date_created": (
                self.date_created.isoformat() if self.date_created else None
            ),
        }


class Livestock(db.Model):
    __tablename__ = "livestock"

    id = db.Column(Integer, primary_key=True, autoincrement=True)
    farm_id = db.Column(Integer, db.ForeignKey("farms.id"), nullable=False, index=True)
    species = db.Column(String(100), nullable=False, index=True)
    breed = db.Column(String(100), nullable=True)
    count = db.Column(Integer, nullable=False)
    age_group = db.Column(String(20), nullable=True)  # young, adult, old
    purpose = db.Column(String(50), nullable=True)  # dairy, meat, breeding, draft
    health_status = db.Column(String(20), default="healthy")
    vaccination_date = db.Column(Date, nullable=True)
    notes = db.Column(Text, nullable=True)
    date_created = db.Column(DateTime, nullable=False, default=datetime.utcnow)
    is_active = db.Column(Boolean, default=True)

    def __repr__(self):
        return f"<Livestock {self.species} - {self.breed} ({self.count})>"

    def to_dict(self):
        return {
            "id": self.id,
            "farm_id": self.farm_id,
            "species": self.species,
            "breed": self.breed,
            "count": self.count,
            "age_group": self.age_group,
            "purpose": self.purpose,
            "health_status": self.health_status,
            "vaccination_date": (
                self.vaccination_date.isoformat() if self.vaccination_date else None
            ),
            "notes": self.notes,
            "date_created": (
                self.date_created.isoformat() if self.date_created else None
            ),
            "is_active": self.is_active,
        }


class Activity(db.Model):
    __tablename__ = "activities"

    id = db.Column(Integer, primary_key=True, autoincrement=True)
    farm_id = db.Column(Integer, db.ForeignKey("farms.id"), nullable=False, index=True)
    activity_type = db.Column(String(100), nullable=False, index=True)
    crop_id = db.Column(Integer, db.ForeignKey("crops.id"), nullable=True)
    date = db.Column(DateTime, nullable=False, default=datetime.utcnow, index=True)
    details = db.Column(Text, nullable=True)
    cost = db.Column(Float, nullable=True)
    labor_hours = db.Column(Float, nullable=True)
    weather_conditions = db.Column(String(100), nullable=True)
    success_rating = db.Column(Integer, nullable=True)  # 1-5 scale
    notes = db.Column(Text, nullable=True)
    attachments = db.Column(Text, nullable=True)  # JSON string for file paths
    is_completed = db.Column(Boolean, default=True)
    created_by = db.Column(String(20), default="manual")  # manual, chat, advisory

    # Relationship to crop (optional)
    crop = db.relationship("Crop", backref="activities", lazy=True)

    def __repr__(self):
        return f"<Activity {self.activity_type} - {self.date}>"

    def to_dict(self):
        return {
            "id": self.id,
            "farm_id": self.farm_id,
            "activity_type": self.activity_type,
            "crop_id": self.crop_id,
            "date": self.date.isoformat() if self.date else None,
            "details": self.details,
            "cost": self.cost,
            "labor_hours": self.labor_hours,
            "weather_conditions": self.weather_conditions,
            "success_rating": self.success_rating,
            "notes": self.notes,
            "attachments": self.attachments,
            "is_completed": self.is_completed,
            "created_by": self.created_by,
        }


# Additional models for enhanced functionality
class WeatherLog(db.Model):
    __tablename__ = "weather_logs"

    id = db.Column(Integer, primary_key=True, autoincrement=True)
    location = db.Column(String(100), nullable=False, index=True)
    date = db.Column(Date, nullable=False, index=True)
    temperature_max = db.Column(Float, nullable=True)
    temperature_min = db.Column(Float, nullable=True)
    humidity = db.Column(Float, nullable=True)
    rainfall = db.Column(Float, nullable=True)
    wind_speed = db.Column(Float, nullable=True)
    weather_condition = db.Column(String(50), nullable=True)
    date_created = db.Column(DateTime, nullable=False, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "location": self.location,
            "date": self.date.isoformat() if self.date else None,
            "temperature_max": self.temperature_max,
            "temperature_min": self.temperature_min,
            "humidity": self.humidity,
            "rainfall": self.rainfall,
            "wind_speed": self.wind_speed,
            "weather_condition": self.weather_condition,
            "date_created": (
                self.date_created.isoformat() if self.date_created else None
            ),
        }


class Advisory(db.Model):
    __tablename__ = "advisories"

    id = db.Column(Integer, primary_key=True, autoincrement=True)
    farmer_id = db.Column(
        Integer, db.ForeignKey("farmers.id"), nullable=True, index=True
    )
    title = db.Column(String(200), nullable=False)
    content = db.Column(Text, nullable=False)
    advisory_type = db.Column(
        String(50), nullable=False, index=True
    )  # weather, pest, disease, general
    priority = db.Column(String(20), default="medium")  # low, medium, high, urgent
    location = db.Column(String(100), nullable=True, index=True)
    crop_type = db.Column(String(50), nullable=True, index=True)
    is_active = db.Column(Boolean, default=True)
    expiry_date = db.Column(DateTime, nullable=True)
    date_created = db.Column(DateTime, nullable=False, default=datetime.utcnow)
    created_by = db.Column(String(50), default="system")

    def to_dict(self):
        return {
            "id": self.id,
            "farmer_id": self.farmer_id,
            "title": self.title,
            "content": self.content,
            "advisory_type": self.advisory_type,
            "priority": self.priority,
            "location": self.location,
            "crop_type": self.crop_type,
            "is_active": self.is_active,
            "expiry_date": self.expiry_date.isoformat() if self.expiry_date else None,
            "date_created": (
                self.date_created.isoformat() if self.date_created else None
            ),
            "created_by": self.created_by,
        }
