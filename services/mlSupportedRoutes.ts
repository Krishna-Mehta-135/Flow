export interface MLSupportedRoute {
  id: string;
  origin: string;
  destination: string;
  description: string;
}

export const ML_SUPPORTED_ROUTES: MLSupportedRoute[] = [
  {
    id: '1',
    origin: "Indira Gandhi International Airport",
    destination: "Connaught Place, New Delhi",
    description: "Airport → CP"
  },
  {
    id: '2',
    origin: "Ghaziabad Railway Station",
    destination: "Akshardham Temple, Delhi",
    description: "Ghaziabad → Akshardham"
  },
  {
    id: '3',
    origin: "Noida City Centre",
    destination: "Gurgaon Cyber City",
    description: "Noida → Cyber City"
  },
  {
    id: '4',
    origin: "Greater Noida Pari Chowk",
    destination: "New Delhi Railway Station",
    description: "Greater Noida → NDLS"
  },
  {
    id: '5',
    origin: "Saket, New Delhi",
    destination: "Gurgaon MG Road",
    description: "Saket → MG Road"
  },
  {
    id: '6',
    origin: "Vasant Kunj",
    destination: "Connaught Place, New Delhi",
    description: "Vasant Kunj → CP"
  },
  {
    id: '7',
    origin: "Rajiv Chowk Metro Station",
    destination: "Dwarka Mor Metro Station",
    description: "Rajiv Chowk → Dwarka Mor"
  },
  {
    id: '8',
    origin: "Kashmere Gate ISBT",
    destination: "Dilshad Garden, East Delhi",
    description: "Kashmere Gate → Dilshad"
  },
  // Special places
  {
    id: '9',
    origin: "AIIMS, New Delhi",
    destination: "Gurgaon Cyber City",
    description: "AIIMS → Cyber City"
  },
  {
    id: '10',
    origin: "Ghaziabad Vaishali Metro",
    destination: "Connaught Place, New Delhi",
    description: "Vaishali → CP"
  },
  {
    id: '11',
    origin: "Sector 62, Noida",
    destination: "Gurgaon Udyog Vihar",
    description: "Noida Sec 62 → Udyog Vihar"
  },
  {
    id: '12',
    origin: "Greater Kailash",
    destination: "Indira Gandhi International Airport",
    description: "GK → Airport"
  },
  {
    id: '13',
    origin: "Dwarka Sector 21 Metro",
    destination: "Noida Sector 62",
    description: "Dwarka → Noida"
  },
  {
    id: '14',
    origin: "Punjabi Bagh",
    destination: "Connaught Place, New Delhi",
    description: "Punjabi Bagh → CP"
  },
  {
    id: '15',
    origin: "Rajouri Garden",
    destination: "Gurgaon MG Road",
    description: "Rajouri Garden → MG Road"
  },
  {
    id: '16',
    origin: "Kalkaji Mandir",
    destination: "Huda City Centre, Gurgaon",
    description: "Kalkaji → Huda City"
  },
  {
    id: '17',
    origin: "South Extension",
    destination: "Noida City Centre",
    description: "South Ex → Noida"
  },
  {
    id: '18',
    origin: "Karol Bagh",
    destination: "Indira Gandhi International Airport",
    description: "Karol Bagh → Airport"
  },
  {
    id: '19',
    origin: "Lajpat Nagar",
    destination: "Saket, New Delhi",
    description: "Lajpat Nagar → Saket"
  },
  {
    id: '20',
    origin: "Janakpuri West Metro",
    destination: "Connaught Place, New Delhi",
    description: "Janakpuri → CP"
  },
  {
    id: '21',
    origin: "Dilshad Garden",
    destination: "Noida Electronic City",
    description: "Dilshad → Electronic City"
  },
  {
    id: '22',
    origin: "Rithala Metro",
    destination: "Kashmere Gate ISBT",
    description: "Rithala → Kashmere Gate"
  },
  {
    id: '23',
    origin: "Shahdara",
    destination: "Connaught Place, New Delhi",
    description: "Shahdara → CP"
  }
];

export const getMLSupportedRoutes = (): MLSupportedRoute[] => {
  return ML_SUPPORTED_ROUTES;
};

export const findRouteById = (id: string): MLSupportedRoute | undefined => {
  return ML_SUPPORTED_ROUTES.find(route => route.id === id);
};

export const searchRoutes = (query: string): MLSupportedRoute[] => {
  const lowercaseQuery = query.toLowerCase().trim();
  
  if (!lowercaseQuery) return [];
  
  return ML_SUPPORTED_ROUTES.filter(route => {
    // Split search terms
    const originWords = route.origin.toLowerCase().split(/[\s,]+/);
    const destinationWords = route.destination.toLowerCase().split(/[\s,]+/);
    const descriptionWords = route.description.toLowerCase().split(/[\s,]+/);
    
    // Check if query matches start of any word
    const matchesWordStart = (words: string[]) => 
      words.some(word => word.startsWith(lowercaseQuery));
    
    // Check if query is contained anywhere
    const containsQuery = (text: string) => 
      text.includes(lowercaseQuery);
    
    return (
      matchesWordStart(originWords) ||
      matchesWordStart(destinationWords) ||
      matchesWordStart(descriptionWords) ||
      containsQuery(route.origin.toLowerCase()) ||
      containsQuery(route.destination.toLowerCase()) ||
      containsQuery(route.description.toLowerCase())
    );
  }).sort((a, b) => {
    // Prioritize routes where query matches the start of origin/destination
    const aStartsWithOrigin = a.origin.toLowerCase().startsWith(lowercaseQuery);
    const bStartsWithOrigin = b.origin.toLowerCase().startsWith(lowercaseQuery);
    const aStartsWithDest = a.destination.toLowerCase().startsWith(lowercaseQuery);
    const bStartsWithDest = b.destination.toLowerCase().startsWith(lowercaseQuery);
    
    if (aStartsWithOrigin && !bStartsWithOrigin) return -1;
    if (!aStartsWithOrigin && bStartsWithOrigin) return 1;
    if (aStartsWithDest && !bStartsWithDest) return -1;
    if (!aStartsWithDest && bStartsWithDest) return 1;
    
    return 0;
  });
};

export const getPopularRoutes = (): MLSupportedRoute[] => {
  // Return most popular routes (to Connaught Place, Airport, etc.)
  return ML_SUPPORTED_ROUTES.filter(route => 
    route.destination.includes("Connaught Place") ||
    route.destination.includes("Airport") ||
    route.destination.includes("Cyber City") ||
    route.origin.includes("Airport")
  );
};