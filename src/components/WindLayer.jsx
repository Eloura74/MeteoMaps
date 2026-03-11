import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

const WindLayer = ({ map, weatherPoints, enabled }) => {
  const layerRef = useRef(null);
  const particlesRef = useRef([]);
  const animationRef = useRef(null);

  useEffect(() => {
    if (!map || !enabled || !weatherPoints || weatherPoints.length < 2) {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    // Custom Canvas Layer
    const WindCanvasLayer = L.Layer.extend({
      onAdd: function (map) {
        this._map = map;
        this._canvas = L.DomUtil.create('canvas', 'leaflet-wind-layer');
        this._canvas.style.position = 'absolute';
        this._canvas.style.pointerEvents = 'none';
        this._canvas.style.zIndex = '400';
        this._canvas.style.opacity = '0.6';
        
        map.getPanes().overlayPane.appendChild(this._canvas);
        map.on('moveend', this._reset, this);
        this._reset();
        this._startAnimation();
      },

      onRemove: function (map) {
        map.getPanes().overlayPane.removeChild(this._canvas);
        map.off('moveend', this._reset, this);
        cancelAnimationFrame(animationRef.current);
      },

      _reset: function () {
        const size = this._map.getSize();
        this._canvas.width = size.x;
        this._canvas.height = size.y;
        const pos = this._map.containerPointToLayerPoint([0, 0]);
        L.DomUtil.setPosition(this._canvas, pos);
        this._initParticles();
      },

      _initParticles: function() {
        // Create particles along the route segments
        const particles = [];
        const count = 150; // Nombre de particules

        for (let i = 0; i < count; i++) {
          particles.push(this._createParticle());
        }
        particlesRef.current = particles;
      },

      _createParticle: function() {
        // Pick a random segment
        const segmentIdx = Math.floor(Math.random() * (weatherPoints.length - 1));
        const p1 = weatherPoints[segmentIdx];
        const p2 = weatherPoints[segmentIdx + 1];
        
        // Random position along segment
        const t = Math.random();
        const lat = p1.lat + t * (p2.lat - p1.lat);
        const lng = p1.lng + t * (p2.lng - p1.lng);
        
        const windSpeed = p2.weather?.wind_speed_10m || 10;
        const windDir = (p2.weather?.wind_direction_10m || 0) * Math.PI / 180;

        return {
          lat, lng,
          x: 0, y: 0, // Pixels
          life: Math.random() * 100,
          maxLife: 20 + Math.random() * 80,
          vx: Math.sin(windDir) * (windSpeed / 10),
          vy: -Math.cos(windDir) * (windSpeed / 10), // North is up
          segmentIdx
        };
      },

      _startAnimation: function() {
        const ctx = this._canvas.getContext('2d');
        
        const animate = () => {
          if (!map) return;
          
          // Fade effect for trails
          ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
          ctx.globalCompositeOperation = 'destination-in';
          ctx.fillRect(0, 0, this._canvas.width, this._canvas.height);
          ctx.globalCompositeOperation = 'source-over';
          
          ctx.strokeStyle = '#94a3b8'; // Slate 400
          ctx.lineWidth = 1;
          
          particlesRef.current.forEach(p => {
            const point = this._map.latLngToContainerPoint([p.lat, p.lng]);
            
            ctx.beginPath();
            ctx.moveTo(point.x, point.y);
            
            // Move particle
            // On convertit les coordonnées GPS en pixels approximativement pour le mouvement fluide
            p.lat += p.vy * 0.0001; 
            p.lng += p.vx * 0.0001;
            p.life++;

            const nextPoint = this._map.latLngToContainerPoint([p.lat, p.lng]);
            ctx.lineTo(nextPoint.x, nextPoint.y);
            ctx.stroke();

            // Respawn if dead
            if (p.life > p.maxLife) {
              Object.assign(p, this._createParticle());
              p.life = 0;
            }
          });

          animationRef.current = requestAnimationFrame(animate);
        };
        
        animate();
      }
    });

    layerRef.current = new WindCanvasLayer();
    map.addLayer(layerRef.current);

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
      }
      cancelAnimationFrame(animationRef.current);
    };
  }, [map, enabled, weatherPoints]);

  return null;
};

export default WindLayer;
