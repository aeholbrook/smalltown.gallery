// Town location data for the interactive map
// Sourced from the original Small Town Documentary project
// Towns with `hasPhotos: true` have photo galleries available

export interface TownLocation {
  name: string
  lat: number
  lng: number
  hasPhotos: boolean
  years?: { year: number; photographer: string }[]
}

// Towns that currently have photo data on the site
export const townsWithPhotos: TownLocation[] = [
  { name: 'Belknap', lat: 37.323230, lng: -88.939540, hasPhotos: true, years: [{ year: 2020, photographer: 'Leah Sutton' }] },
  { name: 'Crab Orchard', lat: 37.7295138, lng: -88.8038199, hasPhotos: true, years: [{ year: 2016, photographer: 'Adam Holbrook' }] },
  { name: 'Fayetteville', lat: 38.377323, lng: -89.79467, hasPhotos: true, years: [{ year: 2018, photographer: 'Natalie Wilkerson' }] },
  { name: 'Oakdale', lat: 38.2615876, lng: -89.5014241, hasPhotos: true, years: [{ year: 2016, photographer: 'Adam Holbrook' }] },
  { name: 'Omaha', lat: 37.8901788, lng: -88.3026621, hasPhotos: true, years: [{ year: 2020, photographer: 'Nicole Tillberg' }] },
  { name: 'Orient', lat: 37.914503, lng: -88.9748755, hasPhotos: true, years: [{ year: 2020, photographer: 'Erik Pedersen' }] },
  { name: 'Ozark', lat: 37.541901, lng: -88.772697, hasPhotos: true, years: [{ year: 2020, photographer: 'Anna Connolly' }] },
  { name: 'Pomona', lat: 37.6281057, lng: -89.3367556, hasPhotos: true, years: [{ year: 2020, photographer: 'Amber Newingham' }] },
  { name: 'Tamaroa', lat: 38.137889, lng: -89.2302123, hasPhotos: true, years: [{ year: 2020, photographer: 'Cheyenne Bruce' }] },
  { name: 'Tamms', lat: 37.243280, lng: -89.262490, hasPhotos: true, years: [{ year: 2018, photographer: 'Alex Rodriguez' }] },
  { name: 'Thompsonville', lat: 37.917570, lng: -88.762230, hasPhotos: true, years: [{ year: 2016, photographer: 'Miranda Munguia' }] },
  { name: 'Ullin', lat: 37.275490, lng: -89.183517, hasPhotos: true, years: [{ year: 2020, photographer: 'Jared Treece' }] },
  { name: 'Vergennes', lat: 37.901806, lng: -89.341801, hasPhotos: true, years: [{ year: 2020, photographer: 'Katie Smith' }] },
]

// All documented towns (full list from original project)
export const allTowns: TownLocation[] = [
  ...townsWithPhotos,
  { name: 'Alto Pass', lat: 37.5701643, lng: -89.3181079, hasPhotos: false },
  { name: 'Ava', lat: 37.8896579, lng: -89.4943984, hasPhotos: false },
  { name: 'Baldwin', lat: 38.182637, lng: -89.842784, hasPhotos: false },
  { name: 'Bonnie', lat: 38.194035, lng: -88.757275, hasPhotos: false },
  { name: 'Boskydell', lat: 37.6713167, lng: -89.2165822, hasPhotos: false },
  { name: 'Brookport', lat: 37.123439, lng: -88.627938, hasPhotos: false },
  { name: 'Buncombe', lat: 37.4715952, lng: -88.9767952, hasPhotos: false },
  { name: 'Cambria', lat: 37.78263, lng: -89.122574, hasPhotos: false },
  { name: 'Campbell Hill', lat: 37.927883, lng: -89.547218, hasPhotos: false },
  { name: 'Carbondale', lat: 37.725281, lng: -89.216721, hasPhotos: false },
  { name: 'Carrier Mills', lat: 37.6837391, lng: -88.6347098, hasPhotos: false },
  { name: 'Carterville', lat: 37.761852, lng: -89.077202, hasPhotos: false },
  { name: 'Cave-In-Rock', lat: 37.468143, lng: -88.166223, hasPhotos: false },
  { name: 'Christopher', lat: 37.9738371, lng: -89.0558593, hasPhotos: false },
  { name: 'Cobden', lat: 37.531516, lng: -89.252785, hasPhotos: false },
  { name: 'Colp', lat: 37.8073902, lng: -89.0787217, hasPhotos: false },
  { name: 'Coulterville', lat: 38.186818, lng: -89.60379, hasPhotos: false },
  { name: 'Crainville', lat: 37.7504911, lng: -89.0695162, hasPhotos: false },
  { name: 'Creal Springs', lat: 37.618415, lng: -88.832342, hasPhotos: false },
  { name: 'Cutler', lat: 38.030143, lng: -89.565768, hasPhotos: false },
  { name: 'Cypress', lat: 37.365069, lng: -89.01559, hasPhotos: false },
  { name: 'Desoto', lat: 37.817483, lng: -89.230089, hasPhotos: false },
  { name: 'Dongola', lat: 37.362161, lng: -89.164477, hasPhotos: false },
  { name: 'Dowell', lat: 37.940029, lng: -89.236478, hasPhotos: false },
  { name: 'Elizabethtown', lat: 37.4460303, lng: -88.3048468, hasPhotos: false },
  { name: 'Elkville', lat: 37.906204, lng: -89.233224, hasPhotos: false },
  { name: 'Energy', lat: 37.775613, lng: -89.026442, hasPhotos: false },
  { name: 'Equality', lat: 37.7350718, lng: -88.3461955, hasPhotos: false },
  { name: 'Evansville', lat: 38.0905412, lng: -89.9363552, hasPhotos: false },
  { name: 'Freeman Spur', lat: 37.8589693, lng: -89.0021899, hasPhotos: false },
  { name: 'Future City / North Cairo', lat: 37.0289402, lng: -89.1881285, hasPhotos: false },
  { name: 'Galatia', lat: 37.8406945, lng: -88.6139572, hasPhotos: false },
  { name: 'Golconda', lat: 37.3677477, lng: -88.4883713, hasPhotos: false },
  { name: 'Goreville', lat: 37.554605, lng: -88.972925, hasPhotos: false },
  { name: 'Gorham, Neunart, and Jacob', lat: 37.716897, lng: -89.485804, hasPhotos: false },
  { name: 'Grand Chain', lat: 37.232487, lng: -89.034456, hasPhotos: false },
  { name: 'Grand Tower', lat: 37.6313495, lng: -89.5051185, hasPhotos: false },
  { name: 'Hartford', lat: 38.830101, lng: -90.095840, hasPhotos: false },
  { name: 'Hurst', lat: 37.8329894, lng: -89.1440593, hasPhotos: false },
  { name: 'Jonesboro', lat: 37.451727, lng: -89.268341, hasPhotos: false },
  { name: 'Joppa', lat: 37.206470, lng: -88.844420, hasPhotos: false },
  { name: 'Karnak', lat: 37.294651, lng: -88.975166, hasPhotos: false },
  { name: 'Kaskaskia', lat: 37.922218, lng: -89.916206, hasPhotos: false },
  { name: 'Lick Creek', lat: 37.523550, lng: -89.070780, hasPhotos: false },
  { name: 'Maeystown', lat: 38.225719, lng: -90.233002, hasPhotos: false },
  { name: 'Makanda', lat: 37.620602, lng: -89.234688, hasPhotos: false },
  { name: 'McClure', lat: 37.317730, lng: -89.437233, hasPhotos: false },
  { name: 'Mound City', lat: 37.084890, lng: -89.163080, hasPhotos: false },
  { name: 'Mounds', lat: 37.114220, lng: -89.197853, hasPhotos: false },
  { name: 'New Burnside', lat: 37.579849, lng: -88.767319, hasPhotos: false },
  { name: 'New Harmony, IN', lat: 38.129826, lng: -87.933985, hasPhotos: false },
  { name: 'Odin', lat: 38.6170879, lng: -89.0539757, hasPhotos: false },
  { name: 'Old Shawneetown', lat: 37.6990634, lng: -88.1370649, hasPhotos: false },
  { name: 'Olive Branch', lat: 37.1686002, lng: -89.3522271, hasPhotos: false },
  { name: 'Olmsted', lat: 37.1809, lng: -89.0871612, hasPhotos: false },
  { name: 'Perks', lat: 37.31029, lng: -89.084031, hasPhotos: false },
  { name: 'Percy', lat: 38.016605, lng: -89.617406, hasPhotos: false },
  { name: 'Pittsburg', lat: 37.777805, lng: -88.850327, hasPhotos: false },
  { name: 'Prairie du Rocher', lat: 38.0784009, lng: -90.1020872, hasPhotos: false },
  { name: 'Rosiclare', lat: 37.423669, lng: -88.346254, hasPhotos: false },
  { name: 'Royalton', lat: 37.8777373, lng: -89.1142714, hasPhotos: false },
  { name: 'Ruma', lat: 38.134529, lng: -89.997993, hasPhotos: false },
  { name: 'Sandusky', lat: 37.20255, lng: -89.27230, hasPhotos: false },
  { name: 'Schuline', lat: 38.0901139, lng: -89.8974731, hasPhotos: false },
  { name: 'Sesser/Valier', lat: 38.091783, lng: -89.053005, hasPhotos: false },
  { name: 'Shawneetown', lat: 37.7156637, lng: -88.1864264, hasPhotos: false },
  { name: 'St. Libory', lat: 38.3640893, lng: -89.7132276, hasPhotos: false },
  { name: 'Steeleville', lat: 38.007056, lng: -89.659032, hasPhotos: false },
  { name: 'Stonefort', lat: 37.615870, lng: -88.705720, hasPhotos: false },
  { name: 'Thebes', lat: 37.2221255, lng: -89.4542134, hasPhotos: false },
  { name: 'Vienna', lat: 37.416033, lng: -88.895993, hasPhotos: false },
  { name: 'Villa Ridge', lat: 37.162820, lng: -89.158180, hasPhotos: false },
  { name: 'Waltonville', lat: 38.2136332, lng: -89.0400125, hasPhotos: false },
  { name: 'Wamac', lat: 38.5105182, lng: -89.1373194, hasPhotos: false },
  { name: 'Ware', lat: 37.2221255, lng: -89.4542134, hasPhotos: false },
  { name: 'Whiteash', lat: 37.792350, lng: -88.923490, hasPhotos: false },
  { name: 'Willisville', lat: 37.982000, lng: -89.591206, hasPhotos: false },
  { name: 'Wolf Lake', lat: 37.529550, lng: -89.445660, hasPhotos: false },
  { name: 'Zeigler', lat: 37.896700, lng: -89.055350, hasPhotos: false },
]

// Map center and bounds for Southern Illinois
export const MAP_CENTER = { lat: 37.75, lng: -89.05 } as const
export const MAP_ZOOM = 7.8 as const
export const MAP_BOUNDS = {
  north: 39.0,
  south: 36.9,
  west: -90.7,
  east: -87.5,
} as const
