// Image helper for restaurant logo
// If you have the direct image URL from Threads, replace this

export const getRestaurantLogo = () => {
  // Telugu Full Meals (Thali) Images
  const teluguThaliImages = [
    "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&h=300&fit=crop", // South Indian thali
    "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=300&fit=crop", // Indian thali
    "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop", // Full meals
    "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop", // Food spread
  ];
  
  // Try Threads image first (if you have it)
  const threadsImage = "https://scontent.cdninstagram.com/v/t51.29350-15/DG73EUryJNL/every-mom-loves-her-children-4k-ultra-hd-wallpaper";
  
  return {
    primary: teluguThaliImages[0], // Primary: Telugu full meals image
    fallbacks: [
      ...teluguThaliImages.slice(1), // Other thali images
      threadsImage, // Threads image as fallback
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop", // Restaurant
    ]
  };
};

// Instructions:
// 1. Right-click the Threads image and "Copy image address"
// 2. Replace the threadsImage URL above with the direct image URL
// OR
// 3. Download the image and place it in frontend/public/images/logo.jpg
// 4. Use: "/images/logo.jpg" as the src

