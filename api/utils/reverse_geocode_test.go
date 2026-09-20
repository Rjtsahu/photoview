package utils

import (
	"testing"
)

func TestHaversineDistance(t *testing.T) {
	// Distance between Bengaluru (12.9716, 77.5946) and nearby point (12.93, 77.63)
	dist := haversineDistance(12.9716, 77.5946, 12.93, 77.63)
	if dist > 10.0 {
		t.Errorf("Expected distance < 10km, got %f", dist)
	}
}

func TestResolveLocationKnownHubs(t *testing.T) {
	// Bengaluru coordinates
	city, state, country := ResolveLocation(nil, 12.93, 77.63)
	if city != "Bengaluru" {
		t.Errorf("Expected Bengaluru, got %s", city)
	}
	if state != "Karnataka" {
		t.Errorf("Expected Karnataka, got %s", state)
	}
	if country != "India" {
		t.Errorf("Expected India, got %s", country)
	}

	// Pench coordinates
	city, _, _ = ResolveLocation(nil, 22.21, 79.74)
	if city != "Pench National Park" {
		t.Errorf("Expected Pench National Park, got %s", city)
	}

	// Zero coordinates
	city, _, _ = ResolveLocation(nil, 0.0, 0.0)
	if city != "" {
		t.Errorf("Expected empty string for zero coordinates, got %s", city)
	}
}
