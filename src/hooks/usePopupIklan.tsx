"use client";

import { useState, useEffect } from 'react';
import PopupIklan from '../app/masyarakat/components/PopupIklan';

/**
 * Hook untuk menampilkan popup iklan sekali per session setelah login
 */
export function usePopupIklan() {
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    // Check if popup has been shown in this session
    const popupShown = sessionStorage.getItem('popupIklanShown');
    
    if (!popupShown) {
      // Show popup after small delay for better UX
      const timer = setTimeout(() => {
        setShowPopup(true);
        sessionStorage.setItem('popupIklanShown', 'true');
      }, 1000); // 1 second delay

      return () => clearTimeout(timer);
    }
  }, []);

  const closePopup = () => {
    setShowPopup(false);
  };

  const PopupComponent = showPopup ? (
    <PopupIklan onClose={closePopup} />
  ) : null;

  return { showPopup, closePopup, PopupComponent };
}
