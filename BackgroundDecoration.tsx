import { useBackground } from '@/contexts/BackgroundContext';
import '@/styles/backgrounds.css';

export function BackgroundDecoration() {
  const { backgroundType, backgroundValue, customImageUrl } = useBackground();

  // Default gradient blobs (static, no animations)
  if (backgroundType === 'gradient' && backgroundValue === 'default') {
    return (
      <div className="bg-container">
        <div className="bg-blob bg-blob-1" />
        <div className="bg-blob bg-blob-2" />
        <div className="bg-blob bg-blob-3" />
        <div className="bg-blob bg-blob-4" />
      </div>
    );
  }

  // Subtle mist (static)
  if (backgroundType === 'gradient' && backgroundValue === 'subtle') {
    return (
      <div className="bg-container">
        <div className="bg-mist" />
      </div>
    );
  }

  // Aurora (CSS animated)
  if (backgroundType === 'gradient' && backgroundValue === 'aurora') {
    return (
      <div className="bg-container">
        <div className="bg-aurora" />
      </div>
    );
  }

  // Sunset (static radial gradients)
  if (backgroundType === 'gradient' && backgroundValue === 'sunset') {
    return (
      <div className="bg-container">
        <div className="bg-sunset" />
      </div>
    );
  }

  // Ocean (CSS animated)
  if (backgroundType === 'gradient' && backgroundValue === 'ocean') {
    return (
      <div className="bg-container">
        <div className="bg-ocean-gradient" />
        <div className="bg-ocean-wave" />
      </div>
    );
  }

  // Forest (static)
  if (backgroundType === 'gradient' && backgroundValue === 'forest') {
    return (
      <div className="bg-container">
        <div className="bg-forest" />
      </div>
    );
  }

  // Custom image
  if (backgroundType === 'custom' && customImageUrl) {
    return (
      <div className="bg-container">
        <div 
          className="bg-custom-image"
          style={{ backgroundImage: `url(${customImageUrl})` }}
        />
        <div className="bg-custom-overlay" />
      </div>
    );
  }

  // ========== ANIMATED BACKGROUNDS ==========

  // Sonoma Horizon - Apple-inspired warm gradient animation
  if (backgroundType === 'animated' && backgroundValue === 'horizon') {
    return (
      <div className="bg-container">
        <div className="bg-horizon">
          <div className="bg-horizon-layer bg-horizon-layer-1" />
          <div className="bg-horizon-layer bg-horizon-layer-2" />
          <div className="bg-horizon-layer bg-horizon-layer-3" />
          <div className="bg-horizon-orb bg-horizon-orb-1" />
          <div className="bg-horizon-orb bg-horizon-orb-2" />
        </div>
      </div>
    );
  }

  // Sequoia Sunrise - Golden sunrise over forest
  if (backgroundType === 'animated' && backgroundValue === 'sequoia') {
    return (
      <div className="bg-container">
        <div className="bg-sequoia">
          <div className="bg-sequoia-sky" />
          <div className="bg-sequoia-sun" />
          <div className="bg-sequoia-glow" />
          <div className="bg-sequoia-rays" />
          <div className="bg-sequoia-mist" />
        </div>
      </div>
    );
  }

  // Cosmic Nebula - Deep space with color shifts
  if (backgroundType === 'animated' && backgroundValue === 'nebula') {
    return (
      <div className="bg-container">
        <div className="bg-nebula">
          <div className="bg-nebula-cloud bg-nebula-cloud-1" />
          <div className="bg-nebula-cloud bg-nebula-cloud-2" />
          <div className="bg-nebula-cloud bg-nebula-cloud-3" />
          <div className="bg-nebula-stars" />
        </div>
      </div>
    );
  }

  // Northern Lights - Aurora borealis effect
  if (backgroundType === 'animated' && backgroundValue === 'northern') {
    return (
      <div className="bg-container">
        <div className="bg-northern">
          <div className="bg-northern-curtain bg-northern-curtain-1" />
          <div className="bg-northern-curtain bg-northern-curtain-2" />
          <div className="bg-northern-curtain bg-northern-curtain-3" />
          <div className="bg-northern-glow" />
        </div>
      </div>
    );
  }

  // Ocean Waves
  if (backgroundType === 'animated' && backgroundValue === 'waves') {
    return (
      <div className="bg-container">
        <div className="bg-waves">
          <div className="bg-waves-base" />
          <div className="bg-waves-layer bg-waves-layer-1" />
          <div className="bg-waves-layer bg-waves-layer-2" />
          <div className="bg-waves-layer bg-waves-layer-3" />
        </div>
      </div>
    );
  }

  // Floating Particles (CSS-only for performance)
  if (backgroundType === 'animated' && backgroundValue === 'particles') {
    return (
      <div className="bg-container">
        <div className="bg-particles">
          {[...Array(15)].map((_, i) => (
            <div 
              key={i} 
              className="bg-particle"
              style={{
                '--particle-x': `${10 + (i * 6) % 80}%`,
                '--particle-delay': `${i * 0.7}s`,
                '--particle-duration': `${12 + (i % 5) * 2}s`,
                '--particle-size': `${3 + (i % 4)}px`,
              } as React.CSSProperties}
            />
          ))}
        </div>
        <div className="bg-particles-overlay" />
      </div>
    );
  }

  // Fallback to default
  return (
    <div className="bg-container">
      <div className="bg-blob bg-blob-1" />
      <div className="bg-blob bg-blob-2" />
      <div className="bg-blob bg-blob-3" />
      <div className="bg-blob bg-blob-4" />
    </div>
  );
}
