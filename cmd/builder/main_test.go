package main

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestMux(t *testing.T) {
	tests := []struct {
		path string
		want int
	}{
		{"/healthz", http.StatusNoContent},
		{"/", http.StatusOK},
		{"/missing", http.StatusNotFound},
	}
	for _, tt := range tests {
		rec := httptest.NewRecorder()
		newMux().ServeHTTP(rec, httptest.NewRequest(http.MethodGet, tt.path, nil))
		if rec.Code != tt.want {
			t.Errorf("GET %s = %d, want %d", tt.path, rec.Code, tt.want)
		}
	}
}
