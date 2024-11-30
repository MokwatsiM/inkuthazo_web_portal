import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import * as analyticsEvents from "../services/analyticsService/events";

export const useAnalytics = () => {
  const location = useLocation();

  // Track page views automatically
  useEffect(() => {
    const pageName = location.pathname;
    const pageTitle = document.title;
    analyticsEvents.trackPageView(pageName, pageTitle);
  }, [location]);

  return {
    ...analyticsEvents,
  };
};
