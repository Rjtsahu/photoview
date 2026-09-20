package utils

import (
	"encoding/json"
	"fmt"
	"math"
	"net/http"
	"sync"
	"time"

	"gorm.io/gorm"
)

type LocationResult struct {
	City    string `json:"city"`
	State   string `json:"state"`
	Country string `json:"country"`
}

type knownLocation struct {
	City     string
	State    string
	Country  string
	Lat      float64
	Lon      float64
	RadiusKm float64
}

// Distance in kilometers using Haversine formula
func haversineDistance(lat1, lon1, lat2, lon2 float64) float64 {
	const earthRadiusKm = 6371.0
	dLat := (lat2 - lat1) * (math.Pi / 180.0)
	dLon := (lon2 - lon1) * (math.Pi / 180.0)

	a := math.Sin(dLat/2)*math.Sin(dLat/2) +
		math.Cos(lat1*(math.Pi/180.0))*math.Cos(lat2*(math.Pi/180.0))*
			math.Sin(dLon/2)*math.Sin(dLon/2)
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))
	return earthRadiusKm * c
}

var knownLocations = []knownLocation{
	{City: "Bengaluru", State: "Karnataka", Country: "India", Lat: 12.9716, Lon: 77.5946, RadiusKm: 45},
	{City: "Nagpur", State: "Maharashtra", Country: "India", Lat: 21.1458, Lon: 79.0882, RadiusKm: 40},
	{City: "Pench National Park", State: "Madhya Pradesh", Country: "India", Lat: 22.215, Lon: 79.742, RadiusKm: 55},
	{City: "Chhindwara & Seoni", State: "Madhya Pradesh", Country: "India", Lat: 22.086, Lon: 79.543, RadiusKm: 60},
	{City: "Nainital", State: "Uttarakhand", Country: "India", Lat: 29.3919, Lon: 79.4542, RadiusKm: 30},
	{City: "Raipur", State: "Chhattisgarh", Country: "India", Lat: 21.2514, Lon: 81.6296, RadiusKm: 45},
	{City: "Sagar", State: "Madhya Pradesh", Country: "India", Lat: 23.8388, Lon: 78.7378, RadiusKm: 40},
	{City: "Indore", State: "Madhya Pradesh", Country: "India", Lat: 22.7196, Lon: 75.8577, RadiusKm: 40},
	{City: "Bhopal", State: "Madhya Pradesh", Country: "India", Lat: 23.2599, Lon: 77.4126, RadiusKm: 40},
	{City: "Shimla", State: "Himachal Pradesh", Country: "India", Lat: 31.1048, Lon: 77.1734, RadiusKm: 40},
	{City: "Coorg & Madikeri", State: "Karnataka", Country: "India", Lat: 12.4244, Lon: 75.7382, RadiusKm: 45},
	{City: "Nilgiris & Ooty", State: "Tamil Nadu", Country: "India", Lat: 11.4102, Lon: 76.695, RadiusKm: 45},
	{City: "Bandipur & Mudumalai", State: "Karnataka", Country: "India", Lat: 11.6667, Lon: 76.6333, RadiusKm: 35},
	{City: "Delhi NCR", State: "Delhi", Country: "India", Lat: 28.6139, Lon: 77.209, RadiusKm: 50},
	{City: "Mumbai", State: "Maharashtra", Country: "India", Lat: 19.076, Lon: 72.8777, RadiusKm: 45},
	{City: "Pune", State: "Maharashtra", Country: "India", Lat: 18.5204, Lon: 73.8567, RadiusKm: 45},
	{City: "Hyderabad", State: "Telangana", Country: "India", Lat: 17.385, Lon: 78.4867, RadiusKm: 45},
	{City: "Chennai", State: "Tamil Nadu", Country: "India", Lat: 13.0827, Lon: 80.2707, RadiusKm: 45},
	{City: "Kolkata", State: "West Bengal", Country: "India", Lat: 22.5726, Lon: 88.3639, RadiusKm: 45},
	{City: "Jaipur", State: "Rajasthan", Country: "India", Lat: 26.9124, Lon: 75.7873, RadiusKm: 40},
	{City: "Goa", State: "Goa", Country: "India", Lat: 15.2993, Lon: 74.124, RadiusKm: 55},
	{City: "Paris", State: "Île-de-France", Country: "France", Lat: 48.8566, Lon: 2.3522, RadiusKm: 45},
	{City: "London", State: "Greater London", Country: "United Kingdom", Lat: 51.5074, Lon: -0.1278, RadiusKm: 45},
	{City: "New York City", State: "New York", Country: "United States", Lat: 40.7128, Lon: -74.006, RadiusKm: 45},
	{City: "San Francisco", State: "California", Country: "United States", Lat: 37.7749, Lon: -122.4194, RadiusKm: 45},
	{City: "Tokyo", State: "Kanto", Country: "Japan", Lat: 35.6762, Lon: 139.6503, RadiusKm: 50},
	{City: "Kyoto", State: "Kansai", Country: "Japan", Lat: 35.0116, Lon: 135.7681, RadiusKm: 40},
	{City: "Dubai", State: "Dubai", Country: "United Arab Emirates", Lat: 25.2048, Lon: 55.2708, RadiusKm: 45},
	{City: "Singapore", State: "Singapore", Country: "Singapore", Lat: 1.3521, Lon: 103.8198, RadiusKm: 35},
	{City: "Swiss Alps", State: "Valais", Country: "Switzerland", Lat: 46.0207, Lon: 7.7491, RadiusKm: 60},
}

var inMemoryGeoCache sync.Map

var httpClient = &http.Client{
	Timeout: 5 * time.Second,
}

// ResolveLocation determines the city, state, and country for a given coordinate.
// It checks in-memory cache, known regional reference centroids, PostgreSQL geo_cache table,
// and falls back to OpenStreetMap Nominatim API (persisting results to geo_cache).
func ResolveLocation(tx *gorm.DB, lat, lon float64) (city, state, country string) {
	if (math.Abs(lat) < 0.01 && math.Abs(lon) < 0.01) || math.IsNaN(lat) || math.IsNaN(lon) {
		return "", "", ""
	}

	latRound := math.Round(lat*100) / 100
	lonRound := math.Round(lon*100) / 100
	cacheKey := fmt.Sprintf("%.2f_%.2f", latRound, lonRound)

	// 1. In-Memory Cache
	if val, ok := inMemoryGeoCache.Load(cacheKey); ok {
		res := val.(LocationResult)
		return res.City, res.State, res.Country
	}

	// 2. Known Reference Hubs
	for _, loc := range knownLocations {
		dist := haversineDistance(latRound, lonRound, loc.Lat, loc.Lon)
		if dist <= loc.RadiusKm {
			city = loc.City
			state = loc.State
			country = loc.Country
			break
		}
	}

	// 3. PostgreSQL geo_cache table
	if city == "" && tx != nil {
		var cached struct {
			City    string
			State   string
			Country string
		}
		err := tx.Table("geo_cache").
			Select("city, state, country").
			Where("lat_round = ? AND lon_round = ?", latRound, lonRound).
			Limit(1).
			Scan(&cached).Error

		if err == nil && cached.City != "" {
			city = cached.City
			state = cached.State
			country = cached.Country
		}
	}

	// 4. OpenStreetMap Nominatim Fallback (called once per unindexed grid)
	if city == "" {
		url := fmt.Sprintf("https://nominatim.openstreetmap.org/reverse?format=json&lat=%.4f&lon=%.4f&zoom=10", latRound, lonRound)
		req, err := http.NewRequest("GET", url, nil)
		if err == nil {
			req.Header.Set("User-Agent", "Photoview-Homelab/1.0 (admin@homelab.local)")
			resp, err := httpClient.Do(req)
			if err == nil && resp.StatusCode == http.StatusOK {
				defer resp.Body.Close()
				var data struct {
					Address map[string]string `json:"address"`
				}
				if err := json.NewDecoder(resp.Body).Decode(&data); err == nil {
					addr := data.Address
					for _, k := range []string{"city", "town", "village", "municipality", "county", "state_district"} {
						if v, ok := addr[k]; ok && v != "" {
							city = v
							break
						}
					}
					if s, ok := addr["state"]; ok && s != "" {
						state = s
					} else if r, ok := addr["region"]; ok {
						state = r
					}
					if c, ok := addr["country"]; ok {
						country = c
					}
				}
			}
		}
	}

	// 5. Fallback coordinate label
	if city == "" {
		latDir := "N"
		if latRound < 0 {
			latDir = "S"
		}
		lonDir := "E"
		if lonRound < 0 {
			lonDir = "W"
		}
		city = fmt.Sprintf("Location (%.2f°%s, %.2f°%s)", math.Abs(latRound), latDir, math.Abs(lonRound), lonDir)
		state = "Geotagged Area"
		country = "Earth"
	}

	// Cache result in PostgreSQL geo_cache
	if tx != nil {
		_ = tx.Exec(
			"INSERT INTO geo_cache (lat_round, lon_round, city, state, country) VALUES (?, ?, ?, ?, ?) ON CONFLICT (lat_round, lon_round) DO NOTHING",
			latRound, lonRound, city, state, country,
		).Error
	}

	// Cache result in memory
	res := LocationResult{City: city, State: state, Country: country}
	inMemoryGeoCache.Store(cacheKey, res)

	return city, state, country
}
