#!/usr/bin/env python3
"""
Database initialization script for Krishi Sakhi
This script sets up the PostgreSQL database with initial data
"""

import os
import sys
from datetime import date, datetime, timedelta

from dotenv import load_dotenv
from flask import Flask

# Add the project root to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from models import Activity, Advisory, Crop, Farm, Farmer, Livestock, WeatherLog, db


def create_app():
    """Create Flask app for database operations"""
    app = Flask(__name__)
    load_dotenv()

    # Database configuration - Force SQLite for now
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///app.db"

    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    db.init_app(app)
    return app


def init_database():
    """Initialize database with tables and sample data"""
    app = create_app()

    with app.app_context():
        print("Creating database tables...")
        db.create_all()

        # Check if data already exists
        if Farmer.query.first():
            print("Database already contains data. Skipping sample data creation.")
            return

        print("Adding sample data...")

        # Create sample farmers
        farmers_data = [
            {
                "name": "Ravi Kumar",
                "phone_number": "+919876543210",
                "email": "ravi.kumar@email.com",
                "address": "Village Thannikkudy, Kottayam District, Kerala",
            },
            {
                "name": "Priya Nair",
                "phone_number": "+919876543211",
                "email": "priya.nair@email.com",
                "address": "Village Kummakonam, Thrissur District, Kerala",
            },
            {
                "name": "Suresh Pillai",
                "phone_number": "+919876543212",
                "email": "suresh.pillai@email.com",
                "address": "Village Chavakkad, Palakkad District, Kerala",
            },
        ]

        farmers = []
        for farmer_data in farmers_data:
            farmer = Farmer(**farmer_data)
            db.session.add(farmer)
            farmers.append(farmer)

        db.session.commit()
        print(f"Created {len(farmers)} farmers")

        # Create sample farms
        farms_data = [
            {
                "farmer_id": farmers[0].id,
                "name": "Ravi's Rice Farm",
                "size": 5.5,
                "location": "Kottayam, Kerala",
                "latitude": 9.5915,
                "longitude": 76.5222,
                "soil_type": "Clay",
                "irrigation_type": "Canal",
            },
            {
                "farmer_id": farmers[0].id,
                "name": "Ravi's Spice Garden",
                "size": 2.0,
                "location": "Kottayam, Kerala",
                "latitude": 9.5920,
                "longitude": 76.5225,
                "soil_type": "Loam",
                "irrigation_type": "Drip",
            },
            {
                "farmer_id": farmers[1].id,
                "name": "Priya's Coconut Farm",
                "size": 8.0,
                "location": "Thrissur, Kerala",
                "latitude": 10.5276,
                "longitude": 76.2144,
                "soil_type": "Sandy Loam",
                "irrigation_type": "Rain-fed",
            },
            {
                "farmer_id": farmers[2].id,
                "name": "Suresh's Mixed Farm",
                "size": 12.0,
                "location": "Palakkad, Kerala",
                "latitude": 10.7867,
                "longitude": 76.6548,
                "soil_type": "Red Soil",
                "irrigation_type": "Bore Well",
            },
        ]

        farms = []
        for farm_data in farms_data:
            farm = Farm(**farm_data)
            db.session.add(farm)
            farms.append(farm)

        db.session.commit()
        print(f"Created {len(farms)} farms")

        # Create sample crops
        current_date = date.today()
        crops_data = [
            {
                "farm_id": farms[0].id,
                "name": "Basmati Rice",
                "variety": "Pusa Basmati 1121",
                "planting_date": current_date - timedelta(days=90),
                "expected_harvest_date": current_date + timedelta(days=30),
                "area_planted": 5.0,
                "expected_yield": 2500,
                "status": "growing",
            },
            {
                "farm_id": farms[1].id,
                "name": "Cardamom",
                "variety": "Malabar",
                "planting_date": current_date - timedelta(days=365),
                "expected_harvest_date": current_date + timedelta(days=180),
                "area_planted": 1.5,
                "expected_yield": 300,
                "status": "growing",
            },
            {
                "farm_id": farms[1].id,
                "name": "Black Pepper",
                "variety": "Karimunda",
                "planting_date": current_date - timedelta(days=730),
                "expected_harvest_date": current_date + timedelta(days=90),
                "area_planted": 0.5,
                "expected_yield": 150,
                "status": "growing",
            },
            {
                "farm_id": farms[2].id,
                "name": "Coconut",
                "variety": "West Coast Tall",
                "planting_date": current_date - timedelta(days=1825),
                "area_planted": 8.0,
                "expected_yield": 8000,
                "status": "harvested",
                "actual_yield": 7500,
                "actual_harvest_date": current_date - timedelta(days=30),
            },
            {
                "farm_id": farms[3].id,
                "name": "Banana",
                "variety": "Robusta",
                "planting_date": current_date - timedelta(days=300),
                "expected_harvest_date": current_date + timedelta(days=65),
                "area_planted": 4.0,
                "expected_yield": 4000,
                "status": "growing",
            },
            {
                "farm_id": farms[3].id,
                "name": "Turmeric",
                "variety": "Alleppey Finger",
                "planting_date": current_date - timedelta(days=240),
                "expected_harvest_date": current_date + timedelta(days=60),
                "area_planted": 3.0,
                "expected_yield": 1800,
                "status": "growing",
            },
        ]

        crops = []
        for crop_data in crops_data:
            crop = Crop(**crop_data)
            db.session.add(crop)
            crops.append(crop)

        db.session.commit()
        print(f"Created {len(crops)} crops")

        # Create sample livestock
        livestock_data = [
            {
                "farm_id": farms[2].id,
                "species": "Cow",
                "breed": "Holstein Friesian",
                "count": 3,
                "age_group": "adult",
                "purpose": "dairy",
                "health_status": "healthy",
            },
            {
                "farm_id": farms[2].id,
                "species": "Goat",
                "breed": "Malabari",
                "count": 8,
                "age_group": "mixed",
                "purpose": "meat",
                "health_status": "healthy",
            },
            {
                "farm_id": farms[3].id,
                "species": "Chicken",
                "breed": "Rhode Island Red",
                "count": 25,
                "age_group": "adult",
                "purpose": "eggs",
                "health_status": "healthy",
            },
            {
                "farm_id": farms[3].id,
                "species": "Duck",
                "breed": "Khaki Campbell",
                "count": 10,
                "age_group": "adult",
                "purpose": "eggs",
                "health_status": "healthy",
            },
        ]

        livestock = []
        for livestock_item in livestock_data:
            animal = Livestock(**livestock_item)
            db.session.add(animal)
            livestock.append(animal)

        db.session.commit()
        print(f"Created {len(livestock)} livestock entries")

        # Create sample activities
        activities_data = [
            {
                "farm_id": farms[0].id,
                "crop_id": crops[0].id,
                "activity_type": "Planting",
                "date": datetime.now() - timedelta(days=90),
                "details": "Planted Basmati rice using direct seeding method",
                "cost": 5000,
                "labor_hours": 16,
                "created_by": "manual",
            },
            {
                "farm_id": farms[0].id,
                "crop_id": crops[0].id,
                "activity_type": "Fertilization",
                "date": datetime.now() - timedelta(days=60),
                "details": "Applied NPK fertilizer (10:26:26) @ 50kg/acre",
                "cost": 2000,
                "labor_hours": 4,
                "created_by": "advisory",
            },
            {
                "farm_id": farms[0].id,
                "crop_id": crops[0].id,
                "activity_type": "Irrigation",
                "date": datetime.now() - timedelta(days=7),
                "details": "Canal irrigation for 8 hours",
                "cost": 500,
                "labor_hours": 2,
                "created_by": "manual",
            },
            {
                "farm_id": farms[1].id,
                "crop_id": crops[1].id,
                "activity_type": "Pest Control",
                "date": datetime.now() - timedelta(days=15),
                "details": "Sprayed organic neem oil for thrips control",
                "cost": 800,
                "labor_hours": 3,
                "success_rating": 4,
                "created_by": "chat",
            },
            {
                "farm_id": farms[2].id,
                "activity_type": "Harvesting",
                "date": datetime.now() - timedelta(days=30),
                "details": "Harvested 7500 coconuts from 80 trees",
                "cost": 3000,
                "labor_hours": 24,
                "success_rating": 5,
                "created_by": "manual",
            },
        ]

        activities = []
        for activity_data in activities_data:
            activity = Activity(**activity_data)
            db.session.add(activity)
            activities.append(activity)

        db.session.commit()
        print(f"Created {len(activities)} activities")

        # Create sample advisories
        advisories_data = [
            {
                "title": "Monsoon Preparation Advisory",
                "content": "Prepare your farms for the upcoming monsoon season. Ensure proper drainage, check irrigation systems, and plan for rain-fed crops.",
                "advisory_type": "weather",
                "priority": "high",
                "location": "Kerala",
                "is_active": True,
                "expiry_date": datetime.now() + timedelta(days=30),
            },
            {
                "title": "Pest Alert: Brown Plant Hopper in Rice",
                "content": "Farmers growing rice should be alert for brown plant hopper infestations. Apply recommended pesticides if population exceeds threshold.",
                "advisory_type": "pest",
                "priority": "medium",
                "location": "Kerala",
                "crop_type": "Rice",
                "is_active": True,
                "expiry_date": datetime.now() + timedelta(days=21),
            },
            {
                "title": "Optimal Harvest Time for Coconut",
                "content": "Coconuts are ready for harvest when they are 11-12 months old. Look for brown husk color and sound when tapped.",
                "advisory_type": "general",
                "priority": "low",
                "location": "Kerala",
                "crop_type": "Coconut",
                "is_active": True,
                "expiry_date": datetime.now() + timedelta(days=60),
            },
        ]

        advisories = []
        for advisory_data in advisories_data:
            advisory = Advisory(**advisory_data)
            db.session.add(advisory)
            advisories.append(advisory)

        db.session.commit()
        print(f"Created {len(advisories)} advisories")

        print("\n✅ Database initialization completed successfully!")
        print(f"📊 Summary:")
        print(f"   - Farmers: {len(farmers)}")
        print(f"   - Farms: {len(farms)}")
        print(f"   - Crops: {len(crops)}")
        print(f"   - Livestock: {len(livestock)}")
        print(f"   - Activities: {len(activities)}")
        print(f"   - Advisories: {len(advisories)}")


if __name__ == "__main__":
    init_database()
