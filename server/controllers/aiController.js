const { GoogleGenerativeAI } = require("@google/generative-ai");
const Trip = require("../models/Trip");
const { protect } = require("../middleware/auth");
const { logger } = require("../middleware/logging");

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// @desc    Generate AI-powered trip itinerary
// @route   POST /api/ai/generate-itinerary
// @access  Private
const generateItinerary = async (req, res) => {
  try {
    // Check if API key is configured
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
      return res.status(503).json({
        success: false,
        message: "AI service is not configured. Please contact the administrator to set up the Gemini API key.",
        error: "GEMINI_API_KEY_NOT_CONFIGURED"
      });
    }

    const {
      destination,
      duration,
      budget,
      travelStyle,
      interests,
      groupSize,
      accommodation,
      transport,
      startDate,
      endDate,
    } = req.body;

    // Validate required fields
    if (!destination || !duration || !budget) {
      return res.status(400).json({
        success: false,
        message: "Destination, duration, and budget are required",
      });
    }

    // Create detailed prompt for Gemini
    const prompt = `Create a detailed ${duration}-day travel itinerary for ${destination} with the following preferences:

Travel Style: ${travelStyle || "balanced"}
Budget Range: ₹${budget.min || 0} - ₹${budget.max || 5000} ${
      budget.currency || "INR"
    }
Group Size: ${groupSize || 1} people
Accommodation Preference: ${accommodation || "hotel"}
Transport Preferences: ${transport?.join(", ") || "flexible"}
Interests: ${interests?.join(", ") || "general sightseeing"}
Start Date: ${startDate || "flexible"}
End Date: ${endDate || "flexible"}

IMPORTANT INSTRUCTIONS:
- For EACH DAY, include 9-10 different activities/places to visit throughout the day
- EVERY ACTIVITY MUST HAVE A SPECIFIC TIME in 24-hour format (e.g., "07:00", "14:30", "19:00")
- EVERY ACTIVITY MUST INCLUDE AN IMAGE URL - use high-quality images from Unsplash or similar sources
- Start from early morning (around 6:00-7:00 AM) and plan activities until evening (around 8:00-9:00 PM)
- Create a COMPLETE TIME SCHEDULE for the entire day from morning to night
- Include a mix of: tourist attractions, local markets, viewpoints, temples/churches, museums, parks, shopping areas, cultural sites, and food spots
- Space activities 1-2 hours apart to allow for travel and exploration time
- Each activity should have a duration of 30 minutes to 2 hours
- Account for travel time between locations when setting activity times
- Include 3-4 meal breaks (breakfast, lunch, snacks, dinner) as separate activities with specific times
- Times should be realistic and follow a logical sequence throughout the day
- For images, use Unsplash URLs in format: https://source.unsplash.com/800x600/?{location-name},{activity-type}

Please provide a detailed day-by-day itinerary in the following JSON format:
{
  "destination": "${destination}",
  "duration": ${duration},
  "totalEstimatedCost": {
    "amount": 0,
    "currency": "${budget.currency || "INR"}"
  },
  "itinerary": [
    {
      "day": 1,
      "date": "2025-11-15",
      "title": "Arrival, Iconic Views & Cultural Introduction",
      "activities": [
        {
          "time": "07:00",
          "activity": "Breakfast at Local Cafe",
          "location": {
            "name": "Cafe Name",
            "address": "Cafe Address",
            "coordinates": {
              "lat": 0.0,
              "lng": 0.0
            }
          },
          "duration": 1,
          "cost": {
            "amount": 50,
            "currency": "INR"
          },
          "description": "Start the day with local breakfast",
          "type": "dining",
          "image": "https://source.unsplash.com/800x600/?breakfast,cafe"
        },
        {
          "time": "08:30",
          "activity": "Visit Temple/Monument 1",
          "location": {
            "name": "Temple Name",
            "address": "Temple Address",
            "coordinates": {
              "lat": 0.0,
              "lng": 0.0
            }
          },
          "duration": 1.5,
          "cost": {
            "amount": 100,
            "currency": "INR"
          },
          "description": "Explore historical temple",
          "type": "attraction",
          "image": "https://source.unsplash.com/800x600/?temple,monument"
        },
        {
          "time": "10:30",
          "activity": "Local Market Visit",
          "location": {
            "name": "Market Name",
            "address": "Market Address",
            "coordinates": {
              "lat": 0.0,
              "lng": 0.0
            }
          },
          "duration": 1,
          "cost": {
            "amount": 50,
            "currency": "INR"
          },
          "description": "Experience local shopping",
          "type": "shopping",
          "image": "https://source.unsplash.com/800x600/?market,shopping"
        },
        {
          "time": "12:00",
          "activity": "Lunch at Traditional Restaurant",
          "location": {
            "name": "Restaurant Name",
            "address": "Restaurant Address",
            "coordinates": {
              "lat": 0.0,
              "lng": 0.0
            }
          },
          "duration": 1,
          "cost": {
            "amount": 150,
            "currency": "INR"
          },
          "description": "Enjoy authentic local cuisine",
          "type": "dining",
          "image": "https://source.unsplash.com/800x600/?restaurant,food"
        },
        {
          "time": "13:30",
          "activity": "Museum Visit",
          "location": {
            "name": "Museum Name",
            "address": "Museum Address",
            "coordinates": {
              "lat": 0.0,
              "lng": 0.0
            }
          },
          "duration": 1.5,
          "cost": {
            "amount": 80,
            "currency": "INR"
          },
          "description": "Learn about local history",
          "type": "attraction",
          "image": "https://source.unsplash.com/800x600/?museum,history"
        },
        {
          "time": "15:30",
          "activity": "Park or Gardens Visit",
          "location": {
            "name": "Park Name",
            "address": "Park Address",
            "coordinates": {
              "lat": 0.0,
              "lng": 0.0
            }
          },
          "duration": 1,
          "cost": {
            "amount": 20,
            "currency": "INR"
          },
          "description": "Relax in scenic gardens",
          "type": "attraction",
          "image": "https://source.unsplash.com/800x600/?park,gardens"
        },
        {
          "time": "17:00",
          "activity": "Viewpoint or Sunset Spot",
          "location": {
            "name": "Viewpoint Name",
            "address": "Viewpoint Address",
            "coordinates": {
              "lat": 0.0,
              "lng": 0.0
            }
          },
          "duration": 1,
          "cost": {
            "amount": 0,
            "currency": "INR"
          },
          "description": "Watch sunset from panoramic point",
          "type": "attraction",
          "image": "https://source.unsplash.com/800x600/?viewpoint,sunset"
        },
        {
          "time": "18:30",
          "activity": "Street Food Tour",
          "location": {
            "name": "Street Food Area",
            "address": "Food Street Address",
            "coordinates": {
              "lat": 0.0,
              "lng": 0.0
            }
          },
          "duration": 0.5,
          "cost": {
            "amount": 40,
            "currency": "INR"
          },
          "description": "Taste local street food",
          "type": "dining",
          "image": "https://source.unsplash.com/800x600/?street-food,food"
        },
        {
          "time": "19:30",
          "activity": "Shopping District Visit",
          "location": {
            "name": "Shopping Area Name",
            "address": "Shopping Area Address",
            "coordinates": {
              "lat": 0.0,
              "lng": 0.0
            }
          },
          "duration": 1,
          "cost": {
            "amount": 100,
            "currency": "INR"
          },
          "description": "Shop for souvenirs",
          "type": "shopping",
          "image": "https://source.unsplash.com/800x600/?shopping,market"
        },
        {
          "time": "21:00",
          "activity": "Dinner at Popular Restaurant",
          "location": {
            "name": "Dinner Restaurant",
            "address": "Restaurant Address",
            "coordinates": {
              "lat": 0.0,
              "lng": 0.0
            }
          },
          "duration": 1.5,
          "cost": {
            "amount": 200,
            "currency": "INR"
          },
          "description": "End day with delicious dinner",
          "type": "dining",
          "image": "https://source.unsplash.com/800x600/?restaurant,dinner"
        }
      ],
      "meals": [
        {
          "time": "12:00",
          "restaurant": "Restaurant Name",
          "cuisine": "Local",
          "cost": {
            "amount": 150,
            "currency": "INR"
          },
          "location": {
            "name": "Restaurant Name",
            "address": "Restaurant Address"
          }
        }
      ],
      "totalDayCost": {
        "amount": 790,
        "currency": "INR"
      }
    }
  ],
  "recommendations": {
    "bestTimeToVisit": "November to March",
    "weather": "Pleasant and mild",
    "localTips": [
      "Carry local currency",
      "Dress modestly when visiting religious sites"
    ],
    "mustSeeAttractions": [
      "Main attraction 1",
      "Main attraction 2"
    ],
    "budgetTips": [
      "Use public transport",
      "Eat at local restaurants"
    ],
    "safetyTips": [
      "Keep copies of important documents",
      "Stay aware of your surroundings"
    ]
  }
}

CRITICAL TIMING REQUIREMENTS:
- EVERY single activity MUST include a "time" field in 24-hour format (HH:MM)
- EVERY single activity MUST include an "image" field with a valid image URL
- Times must follow a chronological sequence throughout the day
- The first activity should typically start between 06:00 and 08:00
- The last activity should typically end between 20:00 and 22:00
- Include realistic time gaps between activities for travel and transitions
- Meal times should be at appropriate hours (breakfast: 07:00-09:00, lunch: 12:00-14:00, dinner: 19:00-22:00)
- Images should be high-quality and relevant to the location/activity using Unsplash format

IMPORTANT: For each day in the itinerary, generate a creative and descriptive "title" that summarizes the theme and main highlights of that day. The title should be concise (3-6 words) and capture the essence of the day's activities.

Examples of good day titles:
- "Arrival, Iconic Views & Seine Cruise"
- "Art, Grandeur & Shopping"
- "Impressionist Art, Latin Quarter & Bohemian Montmartre"
- "Historical Monuments & Local Culture"
- "Beach Relaxation & Water Sports"
- "Mountain Adventures & Scenic Views"

Make sure to include realistic costs, actual attractions, restaurants, and locations for ${destination}. Provide specific addresses and coordinates where possible. The total cost should fit within the budget range of $${
      budget.min || 0
    } - $${budget.max || 5000}.`;

    // Get the generative model
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Generate content using Gemini
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let generatedText = response.text();

    // Clean up the response - remove markdown formatting if present
    generatedText = generatedText
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "");

    // Parse the JSON response
    let itineraryData;
    try {
      itineraryData = JSON.parse(generatedText);
      console.log(
        "Parsed itinerary data:",
        JSON.stringify(itineraryData, null, 2)
      );
      console.log("First day data:", itineraryData.itinerary?.[0]);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      // Fallback: create a basic structure if JSON parsing fails
      itineraryData = {
        destination,
        duration,
        totalEstimatedCost: {
          amount: budget.max || 1000,
          currency: budget.currency || "INR",
        },
        itinerary: [],
        recommendations: {
          bestTimeToVisit: "Year-round",
          weather: "Varies by season",
          localTips: ["Research local customs", "Learn basic phrases"],
          mustSeeAttractions: ["Top attraction in " + destination],
          budgetTips: ["Use public transport", "Eat at local places"],
          safetyTips: ["Keep documents safe", "Stay alert"],
        },
      };
    }

    // Validate and enhance the itinerary data
    if (!itineraryData.itinerary || itineraryData.itinerary.length === 0) {
      // Create basic itinerary if none provided with 9-10 activities per day
      const basicItinerary = [];
      for (let day = 1; day <= duration; day++) {
        const dayDate = startDate
          ? new Date(
              new Date(startDate).getTime() + (day - 1) * 24 * 60 * 60 * 1000
            )
              .toISOString()
              .split("T")[0]
          : `Day ${day}`;
        
        // Create 9-10 activities spread throughout the day
        const activities = [
          {
            time: "07:00",
            activity: `Breakfast at Local Restaurant`,
            location: {
              name: `${destination} Breakfast Spot`,
              address: `${destination} city center`,
              coordinates: { lat: 0, lng: 0 },
            },
            duration: 1,
            cost: {
              amount: Math.round(budget.max / duration / 20),
              currency: budget.currency || "INR",
            },
            description: `Start your day with local breakfast delicacies`,
            type: "dining",
            bookingRequired: false,
            image: `https://source.unsplash.com/800x600/?${destination.replace(/\s+/g, '-')},breakfast`,
          },
          {
            time: "08:30",
            activity: `Visit Main Tourist Attraction ${day}A`,
            location: {
              name: `Popular Site in ${destination}`,
              address: `${destination} tourist area`,
              coordinates: { lat: 0, lng: 0 },
            },
            duration: 1.5,
            cost: {
              amount: Math.round(budget.max / duration / 15),
              currency: budget.currency || "INR",
            },
            description: `Explore one of the top attractions`,
            type: "attraction",
            bookingRequired: false,
            image: `https://source.unsplash.com/800x600/?${destination.replace(/\s+/g, '-')},tourist-attraction`,
          },
          {
            time: "10:30",
            activity: `Local Market Visit`,
            location: {
              name: `${destination} Market`,
              address: `${destination} market district`,
              coordinates: { lat: 0, lng: 0 },
            },
            duration: 1,
            cost: {
              amount: Math.round(budget.max / duration / 25),
              currency: budget.currency || "INR",
            },
            description: `Experience local culture and shopping`,
            type: "shopping",
            bookingRequired: false,
            image: `https://source.unsplash.com/800x600/?${destination.replace(/\s+/g, '-')},market`,
          },
          {
            time: "12:00",
            activity: `Lunch at Traditional Restaurant`,
            location: {
              name: `${destination} Traditional Eatery`,
              address: `${destination} dining area`,
              coordinates: { lat: 0, lng: 0 },
            },
            duration: 1,
            cost: {
              amount: Math.round(budget.max / duration / 18),
              currency: budget.currency || "INR",
            },
            description: `Enjoy authentic local cuisine`,
            type: "dining",
            bookingRequired: false,
            image: `https://source.unsplash.com/800x600/?${destination.replace(/\s+/g, '-')},food`,
          },
          {
            time: "13:30",
            activity: `Museum or Cultural Center Visit`,
            location: {
              name: `${destination} Museum`,
              address: `${destination} cultural quarter`,
              coordinates: { lat: 0, lng: 0 },
            },
            duration: 1.5,
            cost: {
              amount: Math.round(budget.max / duration / 20),
              currency: budget.currency || "INR",
            },
            description: `Learn about local history and culture`,
            type: "attraction",
            bookingRequired: false,
            image: `https://source.unsplash.com/800x600/?${destination.replace(/\s+/g, '-')},museum`,
          },
          {
            time: "15:30",
            activity: `Temple/Church/Historical Monument`,
            location: {
              name: `${destination} Religious Site`,
              address: `${destination} heritage area`,
              coordinates: { lat: 0, lng: 0 },
            },
            duration: 1,
            cost: {
              amount: Math.round(budget.max / duration / 30),
              currency: budget.currency || "INR",
            },
            description: `Visit architectural and spiritual landmark`,
            type: "attraction",
            bookingRequired: false,
            image: `https://source.unsplash.com/800x600/?${destination.replace(/\s+/g, '-')},temple`,
          },
          {
            time: "17:00",
            activity: `Scenic Viewpoint or Park`,
            location: {
              name: `${destination} Viewpoint`,
              address: `${destination} scenic area`,
              coordinates: { lat: 0, lng: 0 },
            },
            duration: 1,
            cost: {
              amount: 0,
              currency: budget.currency || "INR",
            },
            description: `Enjoy panoramic views and sunset`,
            type: "attraction",
            bookingRequired: false,
            image: `https://source.unsplash.com/800x600/?${destination.replace(/\s+/g, '-')},sunset`,
          },
          {
            time: "18:30",
            activity: `Evening Snacks and Local Street Food`,
            location: {
              name: `${destination} Street Food Hub`,
              address: `${destination} food street`,
              coordinates: { lat: 0, lng: 0 },
            },
            duration: 0.5,
            cost: {
              amount: Math.round(budget.max / duration / 35),
              currency: budget.currency || "INR",
            },
            description: `Taste local street food delicacies`,
            type: "dining",
            bookingRequired: false,
            image: `https://source.unsplash.com/800x600/?street-food,${destination.replace(/\s+/g, '-')}`,
          },
          {
            time: "19:30",
            activity: `Shopping District or Night Market`,
            location: {
              name: `${destination} Shopping Area`,
              address: `${destination} commercial zone`,
              coordinates: { lat: 0, lng: 0 },
            },
            duration: 1,
            cost: {
              amount: Math.round(budget.max / duration / 20),
              currency: budget.currency || "INR",
            },
            description: `Shop for souvenirs and local products`,
            type: "shopping",
            bookingRequired: false,
            image: `https://source.unsplash.com/800x600/?shopping,${destination.replace(/\s+/g, '-')}`,
          },
          {
            time: "21:00",
            activity: `Dinner at Popular Restaurant`,
            location: {
              name: `${destination} Restaurant`,
              address: `${destination} dining district`,
              coordinates: { lat: 0, lng: 0 },
            },
            duration: 1.5,
            cost: {
              amount: Math.round(budget.max / duration / 15),
              currency: budget.currency || "INR",
            },
            description: `End the day with a delicious dinner`,
            type: "dining",
            bookingRequired: false,
            image: `https://source.unsplash.com/800x600/?dinner,${destination.replace(/\s+/g, '-')}`,
          },
        ];

        basicItinerary.push({
          day,
          date: dayDate,
          theme: `Day ${day} in ${destination}`,
          activities: activities,
          meals: [
            {
              time: "07:00",
              restaurant: `${destination} Breakfast Spot`,
              cuisine: "Local",
              cost: { amount: Math.round(budget.max / duration / 20), currency: budget.currency || "INR" },
              location: {
                name: `Breakfast Restaurant`,
                address: `${destination} dining area`,
              },
            },
            {
              time: "12:00",
              restaurant: `${destination} Traditional Eatery`,
              cuisine: "Local",
              cost: { amount: Math.round(budget.max / duration / 18), currency: budget.currency || "INR" },
              location: {
                name: `Lunch Restaurant`,
                address: `${destination} dining area`,
              },
            },
            {
              time: "21:00",
              restaurant: `${destination} Restaurant`,
              cuisine: "Local",
              cost: { amount: Math.round(budget.max / duration / 15), currency: budget.currency || "INR" },
              location: {
                name: `Dinner Restaurant`,
                address: `${destination} dining district`,
              },
            },
          ],
          totalDayCost: {
            amount: Math.round(budget.max / duration),
            currency: budget.currency || "INR",
          },
        });
      }
      itineraryData.itinerary = basicItinerary;
    }

    // Calculate total cost if not provided
    if (
      !itineraryData.totalEstimatedCost ||
      itineraryData.totalEstimatedCost.amount === 0
    ) {
      const totalCost = itineraryData.itinerary.reduce((sum, day) => {
        return sum + (day.totalDayCost?.amount || 0);
      }, 0);
      itineraryData.totalEstimatedCost = {
        amount: totalCost,
        currency: budget.currency || "INR",
      };
    }

    res.json({
      success: true,
      message: "Itinerary generated successfully",
      data: itineraryData,
    });
  } catch (error) {
    console.error("Generate itinerary error:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    res.status(500).json({
      success: false,
      message: "Error generating itinerary with AI",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// @desc    Optimize existing itinerary
// @route   POST /api/ai/optimize-itinerary
// @access  Private
const optimizeItinerary = async (req, res) => {
  try {
    const { itinerary, optimizationGoals } = req.body;

    if (!itinerary) {
      return res.status(400).json({
        success: false,
        message: "Itinerary data is required for optimization",
      });
    }

    const goals = optimizationGoals || ["cost", "time", "experience"];

    const prompt = `Optimize the following travel itinerary based on these goals: ${goals.join(
      ", "
    )}.

Current Itinerary:
${JSON.stringify(itinerary, null, 2)}

Please provide an optimized version that:
1. ${
      goals.includes("cost")
        ? "Reduces overall costs while maintaining quality"
        : ""
    }
2. ${
      goals.includes("time")
        ? "Optimizes travel time and reduces unnecessary delays"
        : ""
    }
3. ${
      goals.includes("experience")
        ? "Enhances the overall travel experience"
        : ""
    }
4. Maintains the same destination and duration
5. Keeps the same JSON structure
6. ENSURES every activity has a specific "time" field in 24-hour format (HH:MM)
7. Maintains chronological time sequence throughout each day
8. Includes realistic time gaps for travel between locations

Return the optimized itinerary in the same JSON format with explanations for key changes in an "optimizationNotes" field.`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let optimizedText = response.text();

    // Clean up the response
    optimizedText = optimizedText
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "");

    let optimizedData;
    try {
      optimizedData = JSON.parse(optimizedText);
    } catch (parseError) {
      console.error("Failed to parse optimization response:", parseError);
      // Return original itinerary with basic optimization notes
      optimizedData = {
        ...itinerary,
        optimizationNotes: [
          "Optimization completed",
          "Cost-effective options prioritized",
          "Travel time optimized",
        ],
      };
    }

    res.json({
      success: true,
      message: "Itinerary optimized successfully",
      data: optimizedData,
    });
  } catch (error) {
    console.error("Optimize itinerary error:", error);
    res.status(500).json({
      success: false,
      message: "Error optimizing itinerary",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// @desc    Get travel suggestions based on preferences
// @route   POST /api/ai/travel-suggestions
// @access  Private
const getTravelSuggestions = async (req, res) => {
  try {
    const { preferences, currentLocation, travelHistory } = req.body;

    const user = req.user;
    const userPreferences = user.preferences || {};

    const prompt = `Based on the following user profile and preferences, suggest 5-10 travel destinations:

User Preferences:
- Travel Style: ${
      preferences?.travelStyle || userPreferences.travelStyle || "balanced"
    }
- Budget Range: ${
      preferences?.budgetRange || userPreferences.budgetRange || "moderate"
    }
- Preferred Activities: ${
      preferences?.interests || userPreferences.interests || ["sightseeing"]
    }
- Accommodation Type: ${
      preferences?.accommodation ||
      userPreferences.preferredAccommodation ||
      "hotel"
    }
- Current Location: ${currentLocation || "Not specified"}
- Previous Destinations: ${
      travelHistory?.map((trip) => trip.destination).join(", ") || "None"
    }

Please provide suggestions in the following JSON format:
{
  "suggestions": [
    {
      "destination": "Destination Name",
      "country": "Country",
      "category": "beach/mountain/city/cultural/adventure",
      "estimatedBudget": {
        "min": 60000,
        "max": 120000,
        "currency": "INR"
      },
      "bestTimeToVisit": "March to May",
      "highlights": [
        "Main attraction 1",
        "Main attraction 2",
        "Main attraction 3"
      ],
      "whyRecommended": "Specific reasons based on user preferences",
      "estimatedDuration": "5-7 days",
      "difficultyLevel": "easy/moderate/challenging",
      "uniqueExperiences": [
        "Unique experience 1",
        "Unique experience 2"
      ]
    }
  ],
  "personalizedTips": [
    "Tip based on travel style",
    "Budget optimization tip",
    "Experience enhancement tip"
  ]
}

Focus on destinations that match the user's travel style and haven't been visited before.`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let suggestionsText = response.text();

    // Clean up the response
    suggestionsText = suggestionsText
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "");

    let suggestionsData;
    try {
      suggestionsData = JSON.parse(suggestionsText);
    } catch (parseError) {
      console.error("Failed to parse suggestions response:", parseError);
      // Fallback suggestions
      suggestionsData = {
        suggestions: [
          {
            destination: "Paris",
            country: "France",
            category: "cultural",
            estimatedBudget: { min: 80000, max: 160000, currency: "INR" },
            bestTimeToVisit: "April to June",
            highlights: ["Eiffel Tower", "Louvre Museum", "Notre-Dame"],
            whyRecommended:
              "Perfect for cultural exploration and romantic atmosphere",
            estimatedDuration: "5-7 days",
            difficultyLevel: "easy",
            uniqueExperiences: [
              "Seine River cruise",
              "Montmartre art district",
            ],
          },
        ],
        personalizedTips: [
          "Book accommodations in advance for better rates",
          "Use public transport to save money",
          "Try local cuisines for authentic experience",
        ],
      };
    }

    res.json({
      success: true,
      message: "Travel suggestions generated successfully",
      data: suggestionsData,
    });
  } catch (error) {
    console.error("Get travel suggestions error:", error);
    res.status(500).json({
      success: false,
      message: "Error generating travel suggestions",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// @desc    Generate destination insights
// @route   POST /api/ai/destination-insights
// @access  Private
const getDestinationInsights = async (req, res) => {
  try {
    const { destination, travelDates } = req.body;

    if (!destination) {
      return res.status(400).json({
        success: false,
        message: "Destination is required",
      });
    }

    const prompt = `Provide comprehensive travel insights for ${destination} for travel dates: ${
      travelDates || "flexible"
    }. 

Include the following information in JSON format:
{
  "destination": "${destination}",
  "overview": "Brief description of the destination",
  "weather": {
    "currentSeason": "season name",
    "averageTemperature": "temperature range",
    "rainfall": "rainfall info",
    "bestMonths": ["month1", "month2"]
  },
  "costOfLiving": {
    "level": "low/moderate/high",
    "averageMealCost": "cost range",
    "accommodation": "price range",
    "transport": "cost info"
  },
  "culture": {
    "language": "primary language",
    "currency": "local currency",
    "religion": "primary religion",
    "customs": ["custom1", "custom2"],
    "etiquette": ["tip1", "tip2"]
  },
  "topAttractions": [
    {
      "name": "Attraction name",
      "type": "museum/landmark/nature",
      "description": "brief description",
      "averageVisitTime": "time needed"
    }
  ],
  "localCuisine": [
    {
      "dish": "dish name",
      "description": "what it is",
      "where": "where to find it"
    }
  ],
  "transportation": {
    "publicTransport": "description",
    "ridesharing": "availability",
    "walkability": "walkability score",
    "tips": ["tip1", "tip2"]
  },
  "safety": {
    "level": "low/moderate/high risk",
    "commonIssues": ["issue1", "issue2"],
    "tips": ["safety tip1", "safety tip2"]
  },
  "packingTips": ["item1", "item2", "item3"]
}`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let insightsText = response.text();

    // Clean up the response
    insightsText = insightsText
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "");

    let insightsData;
    try {
      insightsData = JSON.parse(insightsText);
    } catch (parseError) {
      console.error("Failed to parse insights response:", parseError);
      // Fallback insights
      insightsData = {
        destination,
        overview: `${destination} is a popular travel destination with rich culture and attractions.`,
        weather: {
          currentSeason: "varies",
          averageTemperature: "varies by season",
          rainfall: "moderate",
          bestMonths: ["spring", "fall"],
        },
        costOfLiving: {
          level: "moderate",
          averageMealCost: "$15-30",
          accommodation: "$50-150/night",
          transport: "$5-15/day",
        },
        topAttractions: [
          {
            name: `Main attraction in ${destination}`,
            type: "landmark",
            description: "Must-see attraction",
            averageVisitTime: "2-3 hours",
          },
        ],
        safety: {
          level: "low risk",
          tips: ["Keep valuables safe", "Be aware of surroundings"],
        },
      };
    }

    res.json({
      success: true,
      message: "Destination insights generated successfully",
      data: insightsData,
    });
  } catch (error) {
    console.error("Get destination insights error:", error);
    res.status(500).json({
      success: false,
      message: "Error generating destination insights",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// @desc    Get AI-powered trip recommendations
// @route   GET /api/ai/recommendations
// @route   POST /api/ai/recommendations/refresh (clears cache)
// @access  Private
const getRecommendations = async (req, res) => {
  try {
    // Use dummy recommendations instead of AI
    const recommendations = getDummyRecommendations();

    // recommendations generated

    res.status(200).json({
      success: true,
      data: recommendations,
      refreshed: req.method === "POST",
    });
  } catch (error) {
    logger.error("Error getting recommendations:", error);
    res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// Helper: Get random dummy recommendations from a list of 15 destinations
function getDummyRecommendations() {
  const allDestinations = [
    {
      destination: "Paris, France",
      highlights: "Eiffel Tower, Louvre Museum, Seine River Cruise",
      duration: 5,
      estimatedCost: { min: 80000, max: 150000, currency: "INR" },
    },
    {
      destination: "Tokyo, Japan",
      highlights: "Mount Fuji, Ancient Temples, Cherry Blossoms",
      duration: 6,
      estimatedCost: { min: 90000, max: 180000, currency: "INR" },
    },
    {
      destination: "Bali, Indonesia",
      highlights: "Pristine Beaches, Sacred Temples, Rice Terraces",
      duration: 4,
      estimatedCost: { min: 40000, max: 80000, currency: "INR" },
    },
    {
      destination: "Dubai, UAE",
      highlights: "Burj Khalifa, Desert Safari, Luxury Shopping",
      duration: 4,
      estimatedCost: { min: 60000, max: 120000, currency: "INR" },
    },
    {
      destination: "Goa, India",
      highlights: "Golden Beaches, Portuguese Heritage, Vibrant Nightlife",
      duration: 3,
      estimatedCost: { min: 15000, max: 35000, currency: "INR" },
    },
    {
      destination: "Maldives",
      highlights: "Overwater Villas, Coral Reefs, Luxury Resorts",
      duration: 5,
      estimatedCost: { min: 100000, max: 250000, currency: "INR" },
    },
    {
      destination: "Santorini, Greece",
      highlights: "White-washed Buildings, Sunset Views, Aegean Sea",
      duration: 4,
      estimatedCost: { min: 70000, max: 140000, currency: "INR" },
    },
    {
      destination: "New York, USA",
      highlights: "Statue of Liberty, Times Square, Central Park",
      duration: 6,
      estimatedCost: { min: 120000, max: 220000, currency: "INR" },
    },
    {
      destination: "Jaipur, India",
      highlights: "Pink City, Amber Fort, Royal Palaces",
      duration: 3,
      estimatedCost: { min: 12000, max: 30000, currency: "INR" },
    },
    {
      destination: "Barcelona, Spain",
      highlights: "Sagrada Familia, Gothic Quarter, Mediterranean Beaches",
      duration: 5,
      estimatedCost: { min: 75000, max: 145000, currency: "INR" },
    },
    {
      destination: "Singapore",
      highlights: "Marina Bay Sands, Gardens by the Bay, Hawker Centers",
      duration: 4,
      estimatedCost: { min: 55000, max: 110000, currency: "INR" },
    },
    {
      destination: "Kerala, India",
      highlights: "Backwaters, Hill Stations, Ayurvedic Retreats",
      duration: 5,
      estimatedCost: { min: 20000, max: 45000, currency: "INR" },
    },
    {
      destination: "London, England",
      highlights: "Big Ben, British Museum, Thames River",
      duration: 5,
      estimatedCost: { min: 95000, max: 175000, currency: "INR" },
    },
    {
      destination: "Phuket, Thailand",
      highlights: "Tropical Beaches, Island Hopping, Thai Cuisine",
      duration: 5,
      estimatedCost: { min: 45000, max: 90000, currency: "INR" },
    },
    {
      destination: "Manali, India",
      highlights: "Snow-capped Mountains, Adventure Sports, Himalayan Views",
      duration: 4,
      estimatedCost: { min: 18000, max: 40000, currency: "INR" },
    },
  ];

  // Randomly shuffle and return 3 destinations
  return allDestinations
    .sort(() => 0.5 - Math.random())
    .slice(0, 3);
}

// @desc    AI Chatbot for travel assistance
// @route   POST /api/ai/chat
// @access  Public (can be used by non-logged in users too)
const chatWithAI = async (req, res) => {
  try {
    // Check if API key is configured
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
      return res.status(503).json({
        success: false,
        message: "AI service is not configured. Please contact the administrator.",
        error: "GEMINI_API_KEY_NOT_CONFIGURED"
      });
    }

    const { message, conversationHistory } = req.body;

    // Validate required fields
    if (!message || message.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    // Create system prompt for the chatbot
    const systemPrompt = `You are a helpful and friendly AI travel assistant for an AI Trip Planner application. Your role is to:

1. Help users plan their trips and vacations
2. Provide SPECIFIC place names, attractions, and destinations when asked
3. Give detailed travel recommendations with actual location names
4. Answer questions about travel itineraries, budgets, and logistics
5. Suggest activities, attractions, restaurants, and experiences with exact names
6. Help with travel tips, packing advice, and safety information
7. Recommend cities, landmarks, hotels, restaurants, and tourist spots

IMPORTANT GUIDELINES FOR PLACE RECOMMENDATIONS:
- When asked for places to visit, ALWAYS provide specific place names (e.g., "Taj Mahal in Agra", "Gateway of India in Mumbai", "Mysore Palace")
- Include 5-10 specific recommendations when users ask for places
- Mention the city/location for each place
- Provide brief descriptions (1-2 lines) for each recommended place
- Organize recommendations by categories (attractions, restaurants, activities, etc.)
- Include popular, lesser-known, and local favorites

EXAMPLES:
User: "Give me places to visit in Goa"
Assistant: "Here are amazing places to visit in Goa:

🏖️ Beaches:
- Baga Beach - Popular beach with water sports and nightlife
- Palolem Beach - Peaceful crescent beach perfect for relaxation
- Anjuna Beach - Famous for flea markets and sunset views

🏛️ Attractions:
- Basilica of Bom Jesus - UNESCO World Heritage Site in Old Goa
- Fort Aguada - Historic Portuguese fort with lighthouse
- Dudhsagar Waterfalls - Spectacular 4-tiered waterfall

🍽️ Food & Nightlife:
- Thalassa - Greek restaurant with stunning cliff views
- Curlies Beach Shack - Iconic beach club in Anjuna"

Keep responses conversational, enthusiastic, and informative. Use emojis to make it engaging. If users ask about non-travel topics, politely redirect them to travel-related questions.`;

    // Build conversation context
    let conversationContext = systemPrompt + "\n\n";
    
    // Add conversation history if provided
    if (conversationHistory && Array.isArray(conversationHistory)) {
      const recentHistory = conversationHistory.slice(-10); // Keep last 10 messages for context
      recentHistory.forEach(msg => {
        conversationContext += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
      });
    }
    
    conversationContext += `User: ${message}\nAssistant: `;

    // Get AI model
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Generate response
    const result = await model.generateContent(conversationContext);
    const response = await result.response;
    const reply = response.text();

    logger.info("AI chatbot response generated successfully");

    res.status(200).json({
      success: true,
      data: {
        message: reply,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error("Error in AI chatbot:", error);
    
    if (error.message?.includes("API key")) {
      return res.status(503).json({
        success: false,
        message: "AI service configuration error",
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to generate AI response",
      error: error.message,
    });
  }
};

module.exports = {
  generateItinerary,
  optimizeItinerary,
  getTravelSuggestions,
  getDestinationInsights,
  getRecommendations,
  chatWithAI,
};
