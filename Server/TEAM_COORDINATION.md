# Team Coordination for Hackathon

## 🤝 **Integration Timeline**

### **Hour 1-2: Individual Development**
- **You**: Backend API + React Native setup
- **Teammate 1**: ML model for route prediction
- **Teammate 2**: LLM for route switching

### **Hour 3: First Integration**
- **Mock API Testing**: Use mock responses to build UI
- **Share API Contracts**: Exchange request/response formats
- **Test Basic Flow**: End-to-end without ML/LLM

### **Hour 4-5: Real Integration**
- **Connect Live APIs**: Replace mocks with real calls
- **Handle Errors**: Graceful fallbacks when APIs fail
- **Polish UI**: Real data makes the demo shine

### **Hour 6: Demo Preparation**
- **Test Complete Flow**: Source → Options → Selection → Alerts
- **Prepare Demo Script**: Who says what, when
- **Handle Edge Cases**: What if something breaks?

## 📋 **For Your Teammates**

### **Teammate 1 (Route ML) - API Contract**

**Endpoint**: `POST /predict`

**Request**:
```json
{
  "route_key": "Karol Bagh_Indira Gandhi International Airport",
  "hour_of_day": 14,
  "day_of_week": 1,
  "is_weekend": 0,
  "distance_km": 14.386,
  "origin_zone": "Central Delhi",
  "destination_zone": "Airport"
}
```

**Response**:
```json
{
  "predictions": [
    {
      "mode": "carpool",
      "duration_minutes": 45,
      "cost_rupees": 150,
      "traffic_level": "medium",
      "confidence": 0.85
    },
    {
      "mode": "metro", 
      "duration_minutes": 55,
      "cost_rupees": 60,
      "traffic_level": "low",
      "confidence": 0.95
    }
  ]
}
```

### **Teammate 2 (Route Switching LLM) - API Contract**

**Endpoint**: `POST /analyze`

**Request**:
```json
{
  "current_route": {
    "source": "Karol Bagh",
    "destination": "IGI Airport", 
    "selected_mode": "carpool",
    "estimated_time": 45,
    "estimated_cost": 150
  },
  "real_time_data": {
    "traffic_level": "high",
    "incidents": ["accident on NH8"],
    "weather": "clear"
  },
  "user_preferences": {
    "priority": "time", // or "cost"
    "max_budget": 300
  }
}
```

**Response**:
```json
{
  "should_switch": true,
  "reason": "Heavy traffic detected",
  "recommendation": "I recommend switching to metro. There's an accident on NH8 causing 20-minute delays. Metro will get you there faster and save ₹90.",
  "alternatives": [
    {
      "mode": "metro",
      "new_duration": 50,
      "new_cost": 60,
      "benefits": ["Avoid traffic", "Save money", "More reliable"]
    }
  ],
  "confidence": 0.92
}
```

## 🔄 **Fallback Strategy**

If teammates' APIs aren't ready:

1. **Use Mock Data**: Your backend returns realistic mock responses
2. **Show Static Predictions**: "Based on historical data..."
3. **Demo Core Features**: Carpooling and real-time matching still work
4. **Explain Integration**: "Here's where our ML teammate's model would predict..."

## 📱 **Demo Script**

### **Opening (30 seconds)**
"We built a smart transportation platform that combines carpooling with AI-powered route optimization."

### **Main Demo (2 minutes)**
1. **Input Journey**: "I want to go from Karol Bagh to IGI Airport at 2 PM"
2. **Show Options**: "Our ML model predicts these options based on traffic, weather, and historical data"
3. **Select Carpool**: "I choose carpool to save money and help environment"
4. **Real-time Matching**: "Our system instantly found 3 other people with similar routes"
5. **Route Alert**: "Our LLM detected heavy traffic and suggests switching to metro"

### **Closing (30 seconds)**
"This saves users time, money, and reduces traffic congestion in cities."

## 🚨 **Common Hackathon Issues & Solutions**

### **API Integration Problems**:
- **Problem**: Teammate's API isn't ready
- **Solution**: Use mock data, explain integration during demo

### **Different Data Formats**:
- **Problem**: Your backend expects different format than teammate provides
- **Solution**: Add transformation layer in your integration service

### **Demo Day Network Issues**:
- **Problem**: Live APIs fail during demo
- **Solution**: Pre-record demo video as backup, use local mock data

### **Time Management**:
- **Problem**: Not enough time to integrate everything
- **Solution**: Prioritize core carpooling features, show integration points with screenshots

## 🎯 **Success Metrics for Judges**

1. **Technical Innovation**: ML predictions + LLM suggestions + Real-time carpooling
2. **User Experience**: Smooth flow from route input to journey completion
3. **Real-world Impact**: Cost savings, time efficiency, environmental benefits
4. **Team Collaboration**: Show how 3 different technologies work together
5. **Scalability**: Explain how this could work for millions of users

## 📧 **Quick Communication Templates**

**For Teammate 1**:
"Hey! I need your ML API to return predictions in this format: [share JSON]. Can you host it on port 8001? I'll call it from my backend."

**For Teammate 2**:
"Hi! For route switching, I'll send current route data and need you to return LLM recommendations in natural language. Format: [share JSON]"

**Status Updates**:
"Backend APIs ready ✅ React Native 70% done ⏳ Need your endpoints by 3 PM for integration testing!"
