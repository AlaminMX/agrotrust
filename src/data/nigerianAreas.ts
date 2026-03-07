// Mapping of state values to common areas for autocomplete suggestions
export const AREA_SUGGESTIONS: Record<string, string[]> = {
  abuja: [
    'Gwarimpa', 'Wuse', 'Wuse 2', 'Maitama', 'Garki', 'Asokoro', 'Kubwa',
    'Jabi', 'Lugbe', 'Karu', 'Nyanya', 'Bwari', 'Gwagwalada', 'Kuje',
    'Dutse', 'Lifecamp', 'Utako', 'Gudu', 'Apo', 'Lokogoma', 'Karmo',
    'Mpape', 'Durumi', 'Galadimawa', 'Katampe', 'Mabushi',
  ],
  kaduna: [
    'Kabala', 'Barnawa', 'Sabon Tasha', 'Tudun Wada', 'Kakuri', 'Ungwan Rimi',
    'Narayi', 'Rigasa', 'Malali', 'Kawo', 'Ungwan Boro', 'Sabo',
    'Television', 'Gonin Gora', 'Millennium City', 'Nasarawa', 'Zaria Road',
    'Kafanchan', 'Zangon Kataf', 'Kachia', 'Chikun',
  ],
  kano: [
    'Sabon Gari', 'Nassarawa', 'Fagge', 'Gwale', 'Tarauni', 'Kumbotso',
    'Ungogo', 'Dala', 'Kano Municipal', 'Bompai', 'Zoo Road', 'Hotoro',
    'Sharada', 'Dakata', 'Wudil', 'Gwarzo',
  ],
  bauchi: [
    'Bauchi Central', 'Yelwa', 'Wunti', 'Bayara', 'Fadaman Mada',
    'GRA', 'Dass', 'Tafawa Balewa', 'Azare', 'Misau',
    'Ningi', 'Alkaleri', 'Bogoro',
  ],
};

export const getAreaSuggestions = (state: string, query: string): string[] => {
  const areas = AREA_SUGGESTIONS[state] || [];
  if (!query.trim()) return areas;
  const lowerQuery = query.toLowerCase();
  return areas.filter(area => area.toLowerCase().includes(lowerQuery));
};
