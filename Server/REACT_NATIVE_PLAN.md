# React Native App Structure for Hackathon

## 📱 **Screen Flow**

```
🏠 Home Screen
├── 📍 Location Input (Source + Destination)
├── ⏰ Time Selection
└── 🔍 [Get Options] Button
    │
    ↓
🚗 Transportation Options Screen
├── 💰 Cost comparison cards
├── ⏱️ Time comparison
├── 🚦 Traffic indicators
└── ✅ [Select Option] Button
    │
    ↓ (if carpool selected)
🤝 Carpool Matching Screen
├── 👥 Pool members
├── 📍 Pickup location
├── 💸 Split cost
└── 🔔 Real-time status
    │
    ↓
🗺️ Active Journey Screen
├── 📍 Live location tracking
├── 🚨 Route alerts (from teammate 2)
├── 🔄 Switch route suggestions
└── ✅ Complete journey
```

## 🛠 **Key Components to Build**

### 1. **LocationPicker.js**
```jsx
- Google Maps integration
- Address autocomplete
- Save favorite locations
```

### 2. **TransportationCards.js**
```jsx
- Display options from your backend
- Cost/Time comparison
- Traffic level indicators
- Selection buttons
```

### 3. **CarpoolMatchingCard.js**
```jsx
- Pool member avatars
- Cost split breakdown
- Pickup zone map
- Real-time status updates
```

### 4. **RouteSuggestionModal.js**
```jsx
- LLM recommendations display
- Alternative route options
- Quick switch buttons
```

### 5. **ActiveJourneyTracker.js**
```jsx
- Live map with current location
- ETA updates
- Alert notifications
- Emergency contact
```

## 🔌 **API Integration Code**

### Transportation Options Call:
```javascript
const getTransportOptions = async (source, destination, time) => {
  const response = await fetch(`${API_BASE}/api/transportation/options`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${userToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ source, destination, requestedTime: time })
  });
  return response.json();
};
```

### Route Suggestions (Real-time):
```javascript
const getRouteSuggestions = async (transportId) => {
  const response = await fetch(`${API_BASE}/api/transportation/${transportId}/suggestions`, {
    headers: { 'Authorization': `Bearer ${userToken}` }
  });
  return response.json();
};
```

### Socket.IO for Real-time Updates:
```javascript
import io from 'socket.io-client';

const socket = io(API_BASE);
socket.emit('joinRoom', userId);

// Listen for pool formation
socket.on('poolFormed', (poolData) => {
  // Navigate to carpool screen
  // Show notification
});

// Listen for route alerts
socket.on('routeAlert', (alertData) => {
  // Show route switching suggestion
  // Display LLM recommendation
});
```

## 🎯 **Hackathon Demo Flow**

1. **User Journey Demo** (3 minutes):
   - Open app → Select locations → Get options
   - Choose carpool → Show matching process
   - Display real-time pool formation
   - Trigger route alert → Show LLM suggestion

2. **Feature Highlights**:
   - "Look! Our ML model predicted this route will take 45 minutes"
   - "The carpool option saves ₹200 compared to taxi"
   - "Our LLM detected traffic and suggests switching to metro"
   - "Real-time pool matching with 3 other users"

## 📋 **Your Implementation Checklist**

### Backend (30 mins):
- ✅ Transportation model created
- ✅ API endpoints for options/selection
- ✅ Integration points for teammates
- ⏳ Test endpoints with Postman
- ⏳ Add real-time route alerts via Socket.IO

### React Native (2 hours):
- ⏳ Setup navigation between screens
- ⏳ Location picker with maps
- ⏳ Transportation options UI
- ⏳ Carpool matching interface
- ⏳ Socket.IO integration
- ⏳ Route suggestion modals

### Integration (30 mins):
- ⏳ Connect to teammate 1's ML API
- ⏳ Connect to teammate 2's LLM API
- ⏳ Test end-to-end flow
- ⏳ Handle API failures gracefully

## 💡 **Quick Wins for Demo**

1. **Visual Impact**: Use cards/charts to show cost/time comparisons
2. **Real-time Feel**: Socket.IO notifications with sounds/animations
3. **Smart Suggestions**: Display LLM text recommendations prominently
4. **User Benefits**: Highlight money saved, time saved, environmental impact

## 🔧 **Mock Data for Testing**

When teammates' APIs aren't ready, use mock responses to build UI:

```javascript
const MOCK_OPTIONS = [
  { type: 'carpool', cost: 150, time: 45, traffic: 'medium' },
  { type: 'metro', cost: 60, time: 55, traffic: 'low' },
  { type: 'taxi', cost: 400, time: 40, traffic: 'high' }
];

const MOCK_SUGGESTION = {
  message: "Heavy traffic ahead! Switch to metro and save ₹200 + 15 minutes",
  alternatives: [/* ... */]
};
```
