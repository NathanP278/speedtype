/**
 * Hardware-Level Device & Anti-Spoof Probing Engine
 *
 * Unmasks physical device characteristics regardless of User-Agent or viewport spoofing:
 * - Probes WebGL unmasked GPU vendor & renderer (detects Apple Silicon, Adreno, Mali vs desktop NVIDIA/AMD/Intel).
 * - Probes CSS pointer and hover media queries (coarse touch vs fine mouse).
 * - Probes hardware touch points (navigator.maxTouchPoints).
 * - Resolves iPadOS deception (Safari on iPad pretending to be MacIntel desktop).
 * - Flags inconsistencies between claimed UA and true underlying hardware.
 */

export type DeviceCategory = 'mobile' | 'tablet' | 'desktop' | 'foldable' | 'hybrid' | 'unknown';
export type DeviceOS = 'ios' | 'android' | 'macos' | 'windows' | 'linux' | 'cros' | 'unknown';
export type PointerType = 'coarse' | 'fine' | 'none';

export interface DeviceProfile {
  category: DeviceCategory;
  os: DeviceOS;
  formFactor: string;
  gpuVendor: string;
  gpuRenderer: string;
  touchPoints: number;
  pointerType: PointerType;
  hoverSupported: boolean;
  isTouchDevice: boolean;
  isSpoofed: boolean;
  spoofReasons: string[];
  confidence: number; // 0 to 100
  screenWidth: number;
  screenHeight: number;
  pixelRatio: number;
}

/**
 * Extract unmasked WebGL GPU vendor and renderer using WEBGL_debug_renderer_info.
 */
export function probeGpuHardware(): { vendor: string; renderer: string } {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return { vendor: 'SSR / Headless', renderer: 'Software Rasterizer' };
  }

  try {
    const canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;

    if (!gl) {
      return { vendor: 'WebGL Unavailable', renderer: 'Unknown GPU' };
    }

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) {
      const vendor = gl.getParameter(gl.VENDOR) || 'Unknown Vendor';
      const renderer = gl.getParameter(gl.RENDERER) || 'Generic WebGL';
      return { vendor: String(vendor), renderer: String(renderer) };
    }

    const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || 'Unknown Vendor';
    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'Unknown GPU';

    return { vendor: String(vendor), renderer: String(renderer) };
  } catch {
    return { vendor: 'Probing Blocked', renderer: 'Unknown GPU' };
  }
}

/**
 * Detect primary pointer type and hover capability via CSS matchMedia.
 */
export function probePointerCapabilities(): { pointerType: PointerType; hoverSupported: boolean; touchPoints: number } {
  if (typeof window === 'undefined') {
    return { pointerType: 'fine', hoverSupported: true, touchPoints: 0 };
  }

  const touchPoints = typeof navigator !== 'undefined' ? navigator.maxTouchPoints || 0 : 0;
  const hasCoarse = window.matchMedia ? window.matchMedia('(pointer: coarse)').matches : false;
  const hasFine = window.matchMedia ? window.matchMedia('(pointer: fine)').matches : false;
  const hoverSupported = window.matchMedia ? window.matchMedia('(hover: hover)').matches : true;

  let pointerType: PointerType = 'none';
  if (hasCoarse && !hasFine) {
    pointerType = 'coarse';
  } else if (hasFine) {
    pointerType = 'fine';
  } else if (touchPoints > 0) {
    pointerType = 'coarse';
  } else {
    pointerType = 'fine';
  }

  return { pointerType, hoverSupported, touchPoints };
}

/**
 * Perform multi-dimensional hardware probing and anti-spoof analysis.
 */
export function detectDeviceProfile(): DeviceProfile {
  if (typeof window === 'undefined') {
    return {
      category: 'desktop',
      os: 'unknown',
      formFactor: 'Server / Node Environment',
      gpuVendor: 'Headless',
      gpuRenderer: 'Headless',
      touchPoints: 0,
      pointerType: 'fine',
      hoverSupported: true,
      isTouchDevice: false,
      isSpoofed: false,
      spoofReasons: [],
      confidence: 100,
      screenWidth: 1920,
      screenHeight: 1080,
      pixelRatio: 1,
    };
  }

  const ua = (navigator.userAgent || '').toLowerCase();
  const platform = ((navigator as unknown as { userAgentData?: { platform?: string } }).userAgentData?.platform || navigator.platform || '').toLowerCase();
  const gpu = probeGpuHardware();
  const pointer = probePointerCapabilities();

  const screenWidth = window.screen?.width || window.innerWidth || 1024;
  const screenHeight = window.screen?.height || window.innerHeight || 768;
  const pixelRatio = window.devicePixelRatio || 1;
  const isTouchDevice = pointer.touchPoints > 0 || pointer.pointerType === 'coarse' || 'ontouchstart' in window;

  const spoofReasons: string[] = [];
  let os: DeviceOS = 'unknown';
  let category: DeviceCategory = 'desktop';
  let formFactor = 'Desktop PC';
  let confidence = 95;

  const gpuLower = gpu.renderer.toLowerCase();
  const isMobileGpu =
    gpuLower.includes('apple') ||
    gpuLower.includes('adreno') ||
    gpuLower.includes('mali') ||
    gpuLower.includes('powervr') ||
    gpuLower.includes('vivante');

  const isDesktopGpu =
    gpuLower.includes('nvidia') ||
    gpuLower.includes('geforce') ||
    gpuLower.includes('radeon') ||
    gpuLower.includes('amd') ||
    gpuLower.includes('direct3d') ||
    gpuLower.includes('intel arc') ||
    gpuLower.includes('intel(r) uhd') ||
    gpuLower.includes('intel iris');

  // ── 1. iPadOS Deception Detection ──────────────────────────────────────────
  // Safari on iPadOS 13+ sends: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ..." with platform "MacIntel"
  // Real Macs have touchPoints === 0, while iPads have touchPoints >= 2.
  const isClaimedMac = ua.includes('macintosh') || platform.includes('mac');
  const isIPad = isClaimedMac && pointer.touchPoints > 1;

  if (isIPad) {
    category = 'tablet';
    os = 'ios';
    formFactor = 'Apple iPad / iPadOS Tablet';
    confidence = 98;
  } else if (ua.includes('iphone') || ua.includes('ipod')) {
    category = 'mobile';
    os = 'ios';
    formFactor = 'Apple iPhone';
    confidence = 95;

    // Check for spoofing: Claims iPhone, but WebGL has desktop NVIDIA/AMD/Direct3D GPU
    if (isDesktopGpu) {
      spoofReasons.push(`Claimed iPhone User-Agent, but WebGL GPU reports desktop hardware (${gpu.renderer})`);
      confidence -= 40;
    }
    // Claims iPhone, but maxTouchPoints is 0 and pointer is fine mouse
    if (pointer.touchPoints === 0 && pointer.pointerType === 'fine') {
      spoofReasons.push('Claimed mobile iPhone, but no touch hardware points detected (mouse pointer active)');
      confidence -= 30;
    }
  } else if (ua.includes('android')) {
    os = 'android';
    // Android Tablet vs Phone: screen diagonal / smallest screen dimension
    const minDim = Math.min(screenWidth, screenHeight);
    if (minDim >= 600 || ua.includes('tablet')) {
      category = 'tablet';
      formFactor = 'Android Tablet';
    } else {
      category = 'mobile';
      formFactor = 'Android Smartphone';
    }

    if (isDesktopGpu) {
      spoofReasons.push(`Claimed Android device, but WebGL GPU reports desktop hardware (${gpu.renderer})`);
      confidence -= 40;
    }
  } else if (isClaimedMac) {
    os = 'macos';
    category = 'desktop';
    formFactor = 'Apple Mac Desktop / MacBook';
    if (pointer.touchPoints > 0 && !isIPad) {
      category = 'hybrid';
      formFactor = 'Mac Hybrid';
    }
  } else if (ua.includes('windows') || platform.includes('win')) {
    os = 'windows';
    category = pointer.touchPoints > 0 && pointer.pointerType === 'coarse' ? 'tablet' : 'desktop';
    formFactor = pointer.touchPoints > 0 ? 'Windows Touch / 2-in-1' : 'Windows PC / Workstation';
  } else if (ua.includes('cros')) {
    os = 'cros';
    category = pointer.touchPoints > 0 ? 'tablet' : 'desktop';
    formFactor = 'Chromebook';
  } else if (ua.includes('linux')) {
    os = 'linux';
    category = 'desktop';
    formFactor = 'Linux Desktop';
  }

  // ── 2. Viewport & Emulation Anti-Spoof Detection ───────────────────────────
  // A desktop browser emulating mobile in DevTools often sets mobile UA, but screen resolution
  // or window properties retain desktop traits.
  if (category === 'desktop' && pointer.touchPoints > 0 && pointer.pointerType === 'coarse' && !pointer.hoverSupported) {
    // Desktop UA claimed, but device is purely coarse touch without hover
    category = screenWidth < 600 ? 'mobile' : 'tablet';
    spoofReasons.push('Desktop User-Agent detected, but physical input is purely coarse touch without hover');
    confidence -= 25;
  }

  if ((category === 'mobile' || category === 'tablet') && isMobileGpu && pointer.touchPoints > 0) {
    confidence = Math.min(100, confidence + 10);
  }

  const isSpoofed = spoofReasons.length > 0;

  return {
    category,
    os,
    formFactor,
    gpuVendor: gpu.vendor,
    gpuRenderer: gpu.renderer,
    touchPoints: pointer.touchPoints,
    pointerType: pointer.pointerType,
    hoverSupported: pointer.hoverSupported,
    isTouchDevice,
    isSpoofed,
    spoofReasons,
    confidence: Math.max(10, Math.min(100, confidence)),
    screenWidth,
    screenHeight,
    pixelRatio,
  };
}
