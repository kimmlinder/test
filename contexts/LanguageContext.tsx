import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

export type Language = 'en' | 'de' | 'el' | 'sv' | 'es';

export interface Translations {
  // Settings page
  settings: string;
  profile: string;
  personalization: string;
  team: string;
  availability: string;
  notifications: string;
  privacy: string;
  language: string;
  calendar: string;
  
  // Profile section
  fullName: string;
  displayName: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  save: string;
  saving: string;
  cancel: string;
  
  // Personalization
  appearance: string;
  aiAgent: string;
  businessProfile: string;
  personalData: string;
  theme: string;
  lightMode: string;
  darkMode: string;
  colorTheme: string;
  
  // AI Agent
  conversationTone: string;
  responseLength: string;
  languagePreference: string;
  professional: string;
  friendly: string;
  casual: string;
  short: string;
  medium: string;
  detailed: string;
  
  // Notifications
  orderUpdates: string;
  promotions: string;
  systemAlerts: string;
  comments: string;
  mentions: string;
  enabled: string;
  disabled: string;
  
  // Language settings
  interfaceLanguage: string;
  selectLanguage: string;
  languageDescription: string;
  
  // Common
  loading: string;
  error: string;
  success: string;
  comingSoon: string;
  viewAll: string;
  search: string;
  view: string;
  delete: string;
  load: string;
  refresh: string;
  
  // Dashboard & Navigation
  dashboard: string;
  welcome: string;
  welcomeBack: string;
  orders: string;
  products: string;
  wishlist: string;
  home: string;
  shop: string;
  about: string;
  contact: string;
  logout: string;
  login: string;
  signup: string;
  
  // Member specific
  aiCreator: string;
  scenePlans: string;
  features: string;
  totalOrders: string;
  activeOrders: string;
  member: string;
  admin: string;
  portal: string;
  adminView: string;
  memberView: string;
  
  // Sidebar sections
  personal: string;
  shopSection: string;
  account: string;
  // Quick actions
  quickActions: string;
  newOrder: string;
  browseShop: string;
  viewWishlist: string;
  manageSettings: string;
  
  // Stats
  items: string;
  unread: string;
  active: string;
  total: string;
  
  // AI Creator
  askAiAnything: string;
  generateIdeas: string;
  createContent: string;
  
  // Greetings
  goodMorning: string;
  goodAfternoon: string;
  goodEvening: string;
  hereToHelp: string;

  // Orders page
  myOrders: string;
  trackManageOrders: string;
  enableNotifications: string;
  notificationsOn: string;
  exportPdf: string;
  noOrdersToExport: string;
  pdfDownloaded: string;
  orderHistoryExported: string;
  notificationsEnabled: string;
  orderStatusUpdates: string;
  notificationsBlocked: string;
  enableInBrowser: string;
  orderPlaced: string;
  accepted: string;
  workingOnIt: string;
  previewSent: string;
  orderSent: string;
  delivered: string;
  cancelled: string;
  confirmed: string;
  processing: string;
  all: string;
  pending: string;
  inProgress: string;
  shipped: string;
  orderNumber: string;
  tracking: string;
  noOrdersFound: string;
  noOrdersYet: string;
  noFilteredOrders: string;
  startShopping: string;

  // Wishlist page
  myWishlist: string;
  itemsSavedForLater: string;
  removedFromWishlist: string;
  addedToCart: string;
  addToCart: string;
  outOfStock: string;
  wishlistEmpty: string;
  saveItemsHeart: string;
  browseShopButton: string;

  // Shop page
  shopTitle: string;
  shopDescription: string;
  requestCustomWork: string;
  cart: string;
  quickView: string;
  addedToWishlist: string;
  removedFromWishlistShort: string;
  uncategorized: string;
  needSomethingCustom: string;
  customWorkDescription: string;
  physical: string;
  digital: string;
  service: string;

  // Notifications page
  allCaughtUp: string;
  unreadNotifications: string;
  markAllAsRead: string;
  noNotifications: string;
  notifyWhenImportant: string;
  viewDetails: string;
  markAsRead: string;

  // Scene Plans page
  savedScenePlans: string;
  viewManageScenePlans: string;
  createNew: string;
  searchScenePlans: string;
  scenes: string;
  noMatchingPlans: string;
  noSavedPlans: string;
  tryDifferentSearch: string;
  generateFirstPlan: string;
  goToAiCreator: string;
  deleteScenePlan: string;
  deleteScenePlanConfirm: string;
  scenePlanDeleted: string;
  pdfDownloadedSuccess: string;

  // AI Creator page
  aiMediaCreator: string;
  startNewProject: string;
  projectDetails: string;
  basicInfo: string;
  createWithAi: string;
  describeVision: string;
  review: string;
  finalCheck: string;
  videoProduction: string;
  photoShoot: string;
  graphicDesign: string;
  brandContent: string;
  showMockup: string;
  makeMoreProfessional: string;
  addMoreDetails: string;
  suggestAlternatives: string;
  planMyScenes: string;
  suggestShotTypes: string;
  exportProject: string;
  copiedToClipboard: string;
  mockupGenerated: string;
  pdfExportedSuccess: string;
  failedToExportPdf: string;

  // Features page
  featureUsage: string;
  monitorUsage: string;
  aiMediaCreation: string;
  generateBriefs: string;
  mockupGeneration: string;
  createMockups: string;
  customOrders: string;
  submitRequests: string;
  brandAssets: string;
  storeManageFiles: string;
  prioritySupport: string;
  dedicatedSupport: string;
  usageHistory: string;
  trackUsageTime: string;
  totalUsesMonth: string;
  subscriptionPlans: string;
  choosePlan: string;
  free: string;
  premium: string;
  premiumOnly: string;
  notAvailableFree: string;
  whatsIncluded: string;
  upgradeToPremium: string;
  dedicatedManager: string;
  priorityQueue: string;
  responseGuarantee: string;
  exclusiveAccess: string;
  unlimitedRevisions: string;
  unlimited: string;
  perMonth: string;
  files: string;
  included: string;
}

const translations: Record<Language, Translations> = {
  en: {
    settings: 'Settings',
    profile: 'Profile',
    personalization: 'Personalization',
    team: 'Team',
    availability: 'Availability',
    notifications: 'Notifications',
    privacy: 'Privacy',
    language: 'Language',
    calendar: 'Calendar',
    fullName: 'Full Name',
    displayName: 'Display Name',
    email: 'Email',
    phone: 'Phone',
    location: 'Location',
    website: 'Website',
    save: 'Save',
    saving: 'Saving...',
    cancel: 'Cancel',
    appearance: 'Appearance',
    aiAgent: 'AI Agent',
    businessProfile: 'Business Profile',
    personalData: 'Personal Data',
    theme: 'Theme',
    lightMode: 'Light Mode',
    darkMode: 'Dark Mode',
    colorTheme: 'Color Theme',
    conversationTone: 'Conversation Tone',
    responseLength: 'Response Length',
    languagePreference: 'Language Preference',
    professional: 'Professional',
    friendly: 'Friendly',
    casual: 'Casual',
    short: 'Short',
    medium: 'Medium',
    detailed: 'Detailed',
    orderUpdates: 'Order Updates',
    promotions: 'Promotions',
    systemAlerts: 'System Alerts',
    comments: 'Comments',
    mentions: 'Mentions',
    enabled: 'Enabled',
    disabled: 'Disabled',
    interfaceLanguage: 'Interface Language',
    selectLanguage: 'Select your preferred language',
    languageDescription: 'Choose the language for the application interface',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    comingSoon: 'Coming Soon',
    viewAll: 'View All',
    search: 'Search',
    view: 'View',
    delete: 'Delete',
    load: 'Load',
    refresh: 'Refresh',
    dashboard: 'Dashboard',
    welcome: 'Welcome',
    welcomeBack: 'Welcome back',
    orders: 'Orders',
    products: 'Products',
    wishlist: 'Wishlist',
    home: 'Home',
    shop: 'Shop',
    about: 'About',
    contact: 'Contact',
    logout: 'Logout',
    login: 'Login',
    signup: 'Sign Up',
    aiCreator: 'AI Creator',
    scenePlans: 'Scene Plans',
    features: 'Features',
    totalOrders: 'Total Orders',
    activeOrders: 'Active Orders',
    member: 'Member',
    admin: 'Admin',
    portal: 'Portal',
    adminView: 'Admin View',
    memberView: 'Member View',
    personal: 'Personal',
    shopSection: 'Shop',
    account: 'Account',
    quickActions: 'Quick Actions',
    newOrder: 'New Order',
    browseShop: 'Browse Shop',
    viewWishlist: 'View Wishlist',
    manageSettings: 'Manage Settings',
    items: 'items',
    unread: 'unread',
    active: 'active',
    total: 'total',
    askAiAnything: 'Ask AI anything...',
    generateIdeas: 'Generate Ideas',
    createContent: 'Create Content',
    goodMorning: 'Good morning',
    goodAfternoon: 'Good afternoon',
    goodEvening: 'Good evening',
    hereToHelp: "Here's what you can do today",
    // Orders page
    myOrders: 'My Orders',
    trackManageOrders: 'Track and manage all your orders in one place',
    enableNotifications: 'Enable Notifications',
    notificationsOn: 'Notifications On',
    exportPdf: 'Export PDF',
    noOrdersToExport: 'No orders to export',
    pdfDownloaded: 'PDF downloaded!',
    orderHistoryExported: 'Your order history has been exported.',
    notificationsEnabled: 'Notifications enabled!',
    orderStatusUpdates: "You'll receive updates when your order status changes.",
    notificationsBlocked: 'Notifications blocked',
    enableInBrowser: 'Please enable notifications in your browser settings.',
    orderPlaced: 'Order Placed',
    accepted: 'Accepted',
    workingOnIt: 'Working On It',
    previewSent: 'Preview Sent',
    orderSent: 'Order Sent',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    confirmed: 'Confirmed',
    processing: 'Processing',
    all: 'All',
    pending: 'Pending',
    inProgress: 'In Progress',
    shipped: 'Shipped',
    orderNumber: 'Order',
    tracking: 'Tracking',
    noOrdersFound: 'No orders found',
    noOrdersYet: "You haven't placed any orders yet",
    noFilteredOrders: 'No orders',
    startShopping: 'Start Shopping',
    // Wishlist page
    myWishlist: 'My Wishlist',
    itemsSavedForLater: 'Items you\'ve saved for later',
    removedFromWishlist: 'removed from wishlist',
    addedToCart: 'Added to cart',
    addToCart: 'Add to Cart',
    outOfStock: 'Out of Stock',
    wishlistEmpty: 'Your wishlist is empty',
    saveItemsHeart: 'Save items you like by clicking the heart icon',
    browseShopButton: 'Browse Shop',
    // Shop page
    shopTitle: 'Shop',
    shopDescription: 'Explore our premium products, templates, and services designed to elevate your brand.',
    requestCustomWork: 'Request Custom Work',
    cart: 'Cart',
    quickView: 'Quick View',
    addedToWishlist: 'Added to wishlist',
    removedFromWishlistShort: 'Removed from wishlist',
    uncategorized: 'Uncategorized',
    needSomethingCustom: 'Need something custom?',
    customWorkDescription: "Don't see exactly what you need? Tell us about your project and we'll create something unique for you.",
    physical: 'Physical',
    digital: 'Digital',
    service: 'Service',
    // Notifications page
    allCaughtUp: 'All caught up!',
    unreadNotifications: 'unread notification',
    markAllAsRead: 'Mark all as read',
    noNotifications: 'No notifications',
    notifyWhenImportant: "We'll notify you when something important happens",
    viewDetails: 'View details',
    markAsRead: 'Mark as read',
    // Scene Plans page
    savedScenePlans: 'Saved Scene Plans',
    viewManageScenePlans: 'View, manage, and export your generated scene plans',
    createNew: 'Create New',
    searchScenePlans: 'Search scene plans...',
    scenes: 'scenes',
    noMatchingPlans: 'No matching scene plans',
    noSavedPlans: 'No saved scene plans yet',
    tryDifferentSearch: 'Try a different search term',
    generateFirstPlan: 'Generate your first scene plan in the AI Creator',
    goToAiCreator: 'Go to AI Creator',
    deleteScenePlan: 'Delete Scene Plan?',
    deleteScenePlanConfirm: 'This will permanently delete this scene plan. This action cannot be undone.',
    scenePlanDeleted: 'Scene plan deleted',
    pdfDownloadedSuccess: 'PDF downloaded successfully',
    // AI Creator page
    aiMediaCreator: 'AI Media Creator',
    startNewProject: 'Start a new project',
    projectDetails: 'Project Details',
    basicInfo: 'Basic information',
    createWithAi: 'Create with AI',
    describeVision: 'Describe your vision',
    review: 'Review',
    finalCheck: 'Final check',
    videoProduction: 'Video Production',
    photoShoot: 'Photo Shoot',
    graphicDesign: 'Graphic Design',
    brandContent: 'Brand Content',
    showMockup: 'Show me a mockup',
    makeMoreProfessional: 'Make it more professional',
    addMoreDetails: 'Add more details',
    suggestAlternatives: 'Suggest alternatives',
    planMyScenes: 'Plan my scenes',
    suggestShotTypes: 'Suggest shot types',
    exportProject: 'Export Project',
    copiedToClipboard: 'Copied to clipboard',
    mockupGenerated: 'Mockup generated successfully!',
    pdfExportedSuccess: 'PDF exported successfully!',
    failedToExportPdf: 'Failed to export PDF',
    // Features page
    featureUsage: 'Feature Usage & Membership',
    monitorUsage: 'Monitor your feature usage and manage your subscription',
    aiMediaCreation: 'AI Media Creation',
    generateBriefs: 'Generate project briefs with our AI assistant',
    mockupGeneration: 'Mockup Generation',
    createMockups: 'Create visual mockups and concepts',
    customOrders: 'Custom Orders',
    submitRequests: 'Submit custom project requests',
    brandAssets: 'Brand Assets',
    storeManageFiles: 'Store and manage your brand files',
    prioritySupport: 'Priority Support',
    dedicatedSupport: 'Get dedicated support from our team',
    usageHistory: 'Usage History',
    trackUsageTime: 'Track your feature usage over time',
    totalUsesMonth: 'Total uses this month',
    subscriptionPlans: 'Subscription Plans',
    choosePlan: 'Choose a plan to continue',
    free: 'Free',
    premium: 'Premium',
    premiumOnly: 'Premium only',
    notAvailableFree: 'Not Available in Free Plan',
    whatsIncluded: "What's Included:",
    upgradeToPremium: 'Upgrade to Premium',
    dedicatedManager: 'Dedicated account manager for your projects',
    priorityQueue: 'Priority queue for all your orders',
    responseGuarantee: '24-hour response time guarantee',
    exclusiveAccess: 'Exclusive access to new features',
    unlimitedRevisions: 'Unlimited revisions on all projects',
    unlimited: 'Unlimited',
    perMonth: 'per month',
    files: 'files',
    included: 'Included',
  },
  de: {
    settings: 'Einstellungen',
    profile: 'Profil',
    personalization: 'Personalisierung',
    team: 'Team',
    availability: 'Verfügbarkeit',
    notifications: 'Benachrichtigungen',
    privacy: 'Datenschutz',
    language: 'Sprache',
    calendar: 'Kalender',
    fullName: 'Vollständiger Name',
    displayName: 'Anzeigename',
    email: 'E-Mail',
    phone: 'Telefon',
    location: 'Standort',
    website: 'Webseite',
    save: 'Speichern',
    saving: 'Speichern...',
    cancel: 'Abbrechen',
    appearance: 'Erscheinungsbild',
    aiAgent: 'KI-Assistent',
    businessProfile: 'Geschäftsprofil',
    personalData: 'Persönliche Daten',
    theme: 'Design',
    lightMode: 'Heller Modus',
    darkMode: 'Dunkler Modus',
    colorTheme: 'Farbthema',
    conversationTone: 'Gesprächston',
    responseLength: 'Antwortlänge',
    languagePreference: 'Spracheinstellung',
    professional: 'Professionell',
    friendly: 'Freundlich',
    casual: 'Lässig',
    short: 'Kurz',
    medium: 'Mittel',
    detailed: 'Ausführlich',
    orderUpdates: 'Bestellaktualisierungen',
    promotions: 'Aktionen',
    systemAlerts: 'Systemwarnungen',
    comments: 'Kommentare',
    mentions: 'Erwähnungen',
    enabled: 'Aktiviert',
    disabled: 'Deaktiviert',
    interfaceLanguage: 'Oberflächensprache',
    selectLanguage: 'Wählen Sie Ihre bevorzugte Sprache',
    languageDescription: 'Wählen Sie die Sprache für die Anwendungsoberfläche',
    loading: 'Laden...',
    error: 'Fehler',
    success: 'Erfolg',
    comingSoon: 'Demnächst',
    viewAll: 'Alle anzeigen',
    search: 'Suchen',
    view: 'Ansehen',
    delete: 'Löschen',
    load: 'Laden',
    refresh: 'Aktualisieren',
    dashboard: 'Übersicht',
    welcome: 'Willkommen',
    welcomeBack: 'Willkommen zurück',
    orders: 'Bestellungen',
    products: 'Produkte',
    wishlist: 'Wunschliste',
    home: 'Startseite',
    shop: 'Shop',
    about: 'Über uns',
    contact: 'Kontakt',
    logout: 'Abmelden',
    login: 'Anmelden',
    signup: 'Registrieren',
    aiCreator: 'KI-Ersteller',
    scenePlans: 'Szenenpläne',
    features: 'Funktionen',
    totalOrders: 'Gesamtbestellungen',
    activeOrders: 'Aktive Bestellungen',
    member: 'Mitglied',
    admin: 'Admin',
    portal: 'Portal',
    adminView: 'Admin-Ansicht',
    memberView: 'Mitglieder-Ansicht',
    personal: 'Persönlich',
    shopSection: 'Shop',
    account: 'Konto',
    quickActions: 'Schnellaktionen',
    newOrder: 'Neue Bestellung',
    browseShop: 'Shop durchsuchen',
    viewWishlist: 'Wunschliste anzeigen',
    manageSettings: 'Einstellungen verwalten',
    items: 'Artikel',
    unread: 'ungelesen',
    active: 'aktiv',
    total: 'gesamt',
    askAiAnything: 'Frag die KI...',
    generateIdeas: 'Ideen generieren',
    createContent: 'Inhalte erstellen',
    goodMorning: 'Guten Morgen',
    goodAfternoon: 'Guten Tag',
    goodEvening: 'Guten Abend',
    hereToHelp: 'Das können Sie heute tun',
    // Orders page
    myOrders: 'Meine Bestellungen',
    trackManageOrders: 'Verfolgen und verwalten Sie alle Ihre Bestellungen an einem Ort',
    enableNotifications: 'Benachrichtigungen aktivieren',
    notificationsOn: 'Benachrichtigungen an',
    exportPdf: 'PDF exportieren',
    noOrdersToExport: 'Keine Bestellungen zum Exportieren',
    pdfDownloaded: 'PDF heruntergeladen!',
    orderHistoryExported: 'Ihre Bestellhistorie wurde exportiert.',
    notificationsEnabled: 'Benachrichtigungen aktiviert!',
    orderStatusUpdates: 'Sie erhalten Updates, wenn sich Ihr Bestellstatus ändert.',
    notificationsBlocked: 'Benachrichtigungen blockiert',
    enableInBrowser: 'Bitte aktivieren Sie Benachrichtigungen in Ihren Browsereinstellungen.',
    orderPlaced: 'Bestellung aufgegeben',
    accepted: 'Akzeptiert',
    workingOnIt: 'In Bearbeitung',
    previewSent: 'Vorschau gesendet',
    orderSent: 'Bestellung versendet',
    delivered: 'Geliefert',
    cancelled: 'Storniert',
    confirmed: 'Bestätigt',
    processing: 'Wird bearbeitet',
    all: 'Alle',
    pending: 'Ausstehend',
    inProgress: 'In Bearbeitung',
    shipped: 'Versendet',
    orderNumber: 'Bestellung',
    tracking: 'Sendungsverfolgung',
    noOrdersFound: 'Keine Bestellungen gefunden',
    noOrdersYet: 'Sie haben noch keine Bestellungen aufgegeben',
    noFilteredOrders: 'Keine Bestellungen',
    startShopping: 'Einkaufen starten',
    // Wishlist page
    myWishlist: 'Meine Wunschliste',
    itemsSavedForLater: 'Artikel, die Sie für später gespeichert haben',
    removedFromWishlist: 'von der Wunschliste entfernt',
    addedToCart: 'Zum Warenkorb hinzugefügt',
    addToCart: 'In den Warenkorb',
    outOfStock: 'Nicht auf Lager',
    wishlistEmpty: 'Ihre Wunschliste ist leer',
    saveItemsHeart: 'Speichern Sie Artikel durch Klicken auf das Herz-Symbol',
    browseShopButton: 'Shop durchsuchen',
    // Shop page
    shopTitle: 'Shop',
    shopDescription: 'Entdecken Sie unsere Premium-Produkte, Vorlagen und Dienstleistungen für Ihre Marke.',
    requestCustomWork: 'Individuelle Arbeit anfragen',
    cart: 'Warenkorb',
    quickView: 'Schnellansicht',
    addedToWishlist: 'Zur Wunschliste hinzugefügt',
    removedFromWishlistShort: 'Von Wunschliste entfernt',
    uncategorized: 'Nicht kategorisiert',
    needSomethingCustom: 'Brauchen Sie etwas Individuelles?',
    customWorkDescription: 'Nicht gefunden was Sie suchen? Erzählen Sie uns von Ihrem Projekt.',
    physical: 'Physisch',
    digital: 'Digital',
    service: 'Dienstleistung',
    // Notifications page
    allCaughtUp: 'Alles erledigt!',
    unreadNotifications: 'ungelesene Benachrichtigung',
    markAllAsRead: 'Alle als gelesen markieren',
    noNotifications: 'Keine Benachrichtigungen',
    notifyWhenImportant: 'Wir benachrichtigen Sie, wenn etwas Wichtiges passiert',
    viewDetails: 'Details anzeigen',
    markAsRead: 'Als gelesen markieren',
    // Scene Plans page
    savedScenePlans: 'Gespeicherte Szenenpläne',
    viewManageScenePlans: 'Anzeigen, verwalten und exportieren Ihrer generierten Szenenpläne',
    createNew: 'Neu erstellen',
    searchScenePlans: 'Szenenpläne suchen...',
    scenes: 'Szenen',
    noMatchingPlans: 'Keine passenden Szenenpläne',
    noSavedPlans: 'Noch keine gespeicherten Szenenpläne',
    tryDifferentSearch: 'Versuchen Sie einen anderen Suchbegriff',
    generateFirstPlan: 'Erstellen Sie Ihren ersten Szenenplan im KI-Ersteller',
    goToAiCreator: 'Zum KI-Ersteller',
    deleteScenePlan: 'Szenenplan löschen?',
    deleteScenePlanConfirm: 'Dies löscht den Szenenplan dauerhaft. Diese Aktion kann nicht rückgängig gemacht werden.',
    scenePlanDeleted: 'Szenenplan gelöscht',
    pdfDownloadedSuccess: 'PDF erfolgreich heruntergeladen',
    // AI Creator page
    aiMediaCreator: 'KI-Medien-Ersteller',
    startNewProject: 'Neues Projekt starten',
    projectDetails: 'Projektdetails',
    basicInfo: 'Grundinformationen',
    createWithAi: 'Mit KI erstellen',
    describeVision: 'Beschreiben Sie Ihre Vision',
    review: 'Überprüfung',
    finalCheck: 'Abschließende Prüfung',
    videoProduction: 'Videoproduktion',
    photoShoot: 'Fotoshooting',
    graphicDesign: 'Grafikdesign',
    brandContent: 'Markeninhalte',
    showMockup: 'Zeig mir ein Mockup',
    makeMoreProfessional: 'Professioneller gestalten',
    addMoreDetails: 'Mehr Details hinzufügen',
    suggestAlternatives: 'Alternativen vorschlagen',
    planMyScenes: 'Meine Szenen planen',
    suggestShotTypes: 'Kameraeinstellungen vorschlagen',
    exportProject: 'Projekt exportieren',
    copiedToClipboard: 'In Zwischenablage kopiert',
    mockupGenerated: 'Mockup erfolgreich generiert!',
    pdfExportedSuccess: 'PDF erfolgreich exportiert!',
    failedToExportPdf: 'PDF-Export fehlgeschlagen',
    // Features page
    featureUsage: 'Funktionsnutzung & Mitgliedschaft',
    monitorUsage: 'Überwachen Sie Ihre Funktionsnutzung und verwalten Sie Ihr Abonnement',
    aiMediaCreation: 'KI-Medienerstellung',
    generateBriefs: 'Erstellen Sie Projektbriefs mit unserem KI-Assistenten',
    mockupGeneration: 'Mockup-Generierung',
    createMockups: 'Erstellen Sie visuelle Mockups und Konzepte',
    customOrders: 'Individuelle Bestellungen',
    submitRequests: 'Senden Sie individuelle Projektanfragen',
    brandAssets: 'Marken-Assets',
    storeManageFiles: 'Speichern und verwalten Sie Ihre Markendateien',
    prioritySupport: 'Prioritäts-Support',
    dedicatedSupport: 'Erhalten Sie dedizierten Support von unserem Team',
    usageHistory: 'Nutzungsverlauf',
    trackUsageTime: 'Verfolgen Sie Ihre Funktionsnutzung im Zeitverlauf',
    totalUsesMonth: 'Gesamtnutzungen diesen Monat',
    subscriptionPlans: 'Abonnementpläne',
    choosePlan: 'Wählen Sie einen Plan zum Fortfahren',
    free: 'Kostenlos',
    premium: 'Premium',
    premiumOnly: 'Nur Premium',
    notAvailableFree: 'Nicht im kostenlosen Plan verfügbar',
    whatsIncluded: 'Was enthalten ist:',
    upgradeToPremium: 'Auf Premium upgraden',
    dedicatedManager: 'Dedizierter Account-Manager für Ihre Projekte',
    priorityQueue: 'Prioritätswarteschlange für alle Ihre Bestellungen',
    responseGuarantee: '24-Stunden-Antwortzeit-Garantie',
    exclusiveAccess: 'Exklusiver Zugang zu neuen Funktionen',
    unlimitedRevisions: 'Unbegrenzte Überarbeitungen für alle Projekte',
    unlimited: 'Unbegrenzt',
    perMonth: 'pro Monat',
    files: 'Dateien',
    included: 'Enthalten',
  },
  el: {
    settings: 'Ρυθμίσεις',
    profile: 'Προφίλ',
    personalization: 'Εξατομίκευση',
    team: 'Ομάδα',
    availability: 'Διαθεσιμότητα',
    notifications: 'Ειδοποιήσεις',
    privacy: 'Απόρρητο',
    language: 'Γλώσσα',
    calendar: 'Ημερολόγιο',
    fullName: 'Πλήρες Όνομα',
    displayName: 'Εμφανιζόμενο Όνομα',
    email: 'Email',
    phone: 'Τηλέφωνο',
    location: 'Τοποθεσία',
    website: 'Ιστοσελίδα',
    save: 'Αποθήκευση',
    saving: 'Αποθήκευση...',
    cancel: 'Ακύρωση',
    appearance: 'Εμφάνιση',
    aiAgent: 'AI Βοηθός',
    businessProfile: 'Επιχειρηματικό Προφίλ',
    personalData: 'Προσωπικά Δεδομένα',
    theme: 'Θέμα',
    lightMode: 'Φωτεινή Λειτουργία',
    darkMode: 'Σκοτεινή Λειτουργία',
    colorTheme: 'Χρωματικό Θέμα',
    conversationTone: 'Τόνος Συνομιλίας',
    responseLength: 'Μήκος Απάντησης',
    languagePreference: 'Προτίμηση Γλώσσας',
    professional: 'Επαγγελματικός',
    friendly: 'Φιλικός',
    casual: 'Χαλαρός',
    short: 'Σύντομο',
    medium: 'Μεσαίο',
    detailed: 'Αναλυτικό',
    orderUpdates: 'Ενημερώσεις Παραγγελιών',
    promotions: 'Προσφορές',
    systemAlerts: 'Ειδοποιήσεις Συστήματος',
    comments: 'Σχόλια',
    mentions: 'Αναφορές',
    enabled: 'Ενεργοποιημένο',
    disabled: 'Απενεργοποιημένο',
    interfaceLanguage: 'Γλώσσα Διεπαφής',
    selectLanguage: 'Επιλέξτε τη γλώσσα σας',
    languageDescription: 'Επιλέξτε τη γλώσσα για τη διεπαφή της εφαρμογής',
    loading: 'Φόρτωση...',
    error: 'Σφάλμα',
    success: 'Επιτυχία',
    comingSoon: 'Έρχεται Σύντομα',
    viewAll: 'Προβολή Όλων',
    search: 'Αναζήτηση',
    view: 'Προβολή',
    delete: 'Διαγραφή',
    load: 'Φόρτωση',
    refresh: 'Ανανέωση',
    dashboard: 'Πίνακας Ελέγχου',
    welcome: 'Καλώς ήρθατε',
    welcomeBack: 'Καλώς ήρθατε ξανά',
    orders: 'Παραγγελίες',
    products: 'Προϊόντα',
    wishlist: 'Λίστα Επιθυμιών',
    home: 'Αρχική',
    shop: 'Κατάστημα',
    about: 'Σχετικά',
    contact: 'Επικοινωνία',
    logout: 'Αποσύνδεση',
    login: 'Σύνδεση',
    signup: 'Εγγραφή',
    aiCreator: 'AI Δημιουργός',
    scenePlans: 'Πλάνα Σκηνών',
    features: 'Χαρακτηριστικά',
    totalOrders: 'Συνολικές Παραγγελίες',
    activeOrders: 'Ενεργές Παραγγελίες',
    member: 'Μέλος',
    admin: 'Διαχειριστής',
    portal: 'Πύλη',
    adminView: 'Προβολή Διαχειριστή',
    memberView: 'Προβολή Μέλους',
    personal: 'Προσωπικά',
    shopSection: 'Κατάστημα',
    account: 'Λογαριασμός',
    quickActions: 'Γρήγορες Ενέργειες',
    newOrder: 'Νέα Παραγγελία',
    browseShop: 'Περιήγηση Καταστήματος',
    viewWishlist: 'Προβολή Λίστας Επιθυμιών',
    manageSettings: 'Διαχείριση Ρυθμίσεων',
    items: 'αντικείμενα',
    unread: 'αδιάβαστα',
    active: 'ενεργά',
    total: 'σύνολο',
    askAiAnything: 'Ρωτήστε την AI...',
    generateIdeas: 'Δημιουργία Ιδεών',
    createContent: 'Δημιουργία Περιεχομένου',
    goodMorning: 'Καλημέρα',
    goodAfternoon: 'Καλό απόγευμα',
    goodEvening: 'Καλησπέρα',
    hereToHelp: 'Τι μπορείτε να κάνετε σήμερα',
    // Orders page
    myOrders: 'Οι Παραγγελίες μου',
    trackManageOrders: 'Παρακολουθήστε και διαχειριστείτε όλες τις παραγγελίες σας',
    enableNotifications: 'Ενεργοποίηση Ειδοποιήσεων',
    notificationsOn: 'Ειδοποιήσεις Ενεργές',
    exportPdf: 'Εξαγωγή PDF',
    noOrdersToExport: 'Δεν υπάρχουν παραγγελίες για εξαγωγή',
    pdfDownloaded: 'Το PDF κατέβηκε!',
    orderHistoryExported: 'Το ιστορικό παραγγελιών εξήχθη.',
    notificationsEnabled: 'Οι ειδοποιήσεις ενεργοποιήθηκαν!',
    orderStatusUpdates: 'Θα λαμβάνετε ενημερώσεις όταν αλλάζει η κατάσταση της παραγγελίας.',
    notificationsBlocked: 'Οι ειδοποιήσεις αποκλείστηκαν',
    enableInBrowser: 'Ενεργοποιήστε τις ειδοποιήσεις στις ρυθμίσεις του browser.',
    orderPlaced: 'Παραγγελία Καταχωρήθηκε',
    accepted: 'Αποδεκτή',
    workingOnIt: 'Σε Εξέλιξη',
    previewSent: 'Προεπισκόπηση Εστάλη',
    orderSent: 'Παραγγελία Εστάλη',
    delivered: 'Παραδόθηκε',
    cancelled: 'Ακυρώθηκε',
    confirmed: 'Επιβεβαιώθηκε',
    processing: 'Επεξεργασία',
    all: 'Όλες',
    pending: 'Σε Αναμονή',
    inProgress: 'Σε Εξέλιξη',
    shipped: 'Απεστάλη',
    orderNumber: 'Παραγγελία',
    tracking: 'Παρακολούθηση',
    noOrdersFound: 'Δεν βρέθηκαν παραγγελίες',
    noOrdersYet: 'Δεν έχετε κάνει ακόμα παραγγελίες',
    noFilteredOrders: 'Καμία παραγγελία',
    startShopping: 'Ξεκινήστε Αγορές',
    // Wishlist page
    myWishlist: 'Η Λίστα Επιθυμιών μου',
    itemsSavedForLater: 'Αντικείμενα που αποθηκεύσατε για αργότερα',
    removedFromWishlist: 'αφαιρέθηκε από τη λίστα επιθυμιών',
    addedToCart: 'Προστέθηκε στο καλάθι',
    addToCart: 'Προσθήκη στο Καλάθι',
    outOfStock: 'Εξαντλημένο',
    wishlistEmpty: 'Η λίστα επιθυμιών είναι άδεια',
    saveItemsHeart: 'Αποθηκεύστε αντικείμενα πατώντας το εικονίδιο καρδιάς',
    browseShopButton: 'Περιήγηση Καταστήματος',
    // Shop page
    shopTitle: 'Κατάστημα',
    shopDescription: 'Εξερευνήστε τα premium προϊόντα, πρότυπα και υπηρεσίες μας.',
    requestCustomWork: 'Αίτημα Προσαρμοσμένης Εργασίας',
    cart: 'Καλάθι',
    quickView: 'Γρήγορη Προβολή',
    addedToWishlist: 'Προστέθηκε στη λίστα επιθυμιών',
    removedFromWishlistShort: 'Αφαιρέθηκε από τη λίστα επιθυμιών',
    uncategorized: 'Χωρίς κατηγορία',
    needSomethingCustom: 'Χρειάζεστε κάτι προσαρμοσμένο;',
    customWorkDescription: 'Δεν βρήκατε αυτό που ψάχνετε; Πείτε μας για το έργο σας.',
    physical: 'Φυσικό',
    digital: 'Ψηφιακό',
    service: 'Υπηρεσία',
    // Notifications page
    allCaughtUp: 'Όλα ενημερωμένα!',
    unreadNotifications: 'αδιάβαστη ειδοποίηση',
    markAllAsRead: 'Σήμανση όλων ως αναγνωσμένα',
    noNotifications: 'Καμία ειδοποίηση',
    notifyWhenImportant: 'Θα σας ειδοποιήσουμε όταν συμβεί κάτι σημαντικό',
    viewDetails: 'Προβολή λεπτομερειών',
    markAsRead: 'Σήμανση ως αναγνωσμένο',
    // Scene Plans page
    savedScenePlans: 'Αποθηκευμένα Πλάνα Σκηνών',
    viewManageScenePlans: 'Προβολή, διαχείριση και εξαγωγή των πλάνων σκηνών σας',
    createNew: 'Δημιουργία Νέου',
    searchScenePlans: 'Αναζήτηση πλάνων σκηνών...',
    scenes: 'σκηνές',
    noMatchingPlans: 'Δεν βρέθηκαν αντίστοιχα πλάνα',
    noSavedPlans: 'Δεν υπάρχουν αποθηκευμένα πλάνα σκηνών',
    tryDifferentSearch: 'Δοκιμάστε διαφορετικό όρο αναζήτησης',
    generateFirstPlan: 'Δημιουργήστε το πρώτο σας πλάνο στον AI Δημιουργό',
    goToAiCreator: 'Μετάβαση στον AI Δημιουργό',
    deleteScenePlan: 'Διαγραφή Πλάνου Σκηνής;',
    deleteScenePlanConfirm: 'Αυτό θα διαγράψει μόνιμα το πλάνο σκηνής. Αυτή η ενέργεια δεν μπορεί να αναιρεθεί.',
    scenePlanDeleted: 'Το πλάνο σκηνής διαγράφηκε',
    pdfDownloadedSuccess: 'Το PDF κατέβηκε επιτυχώς',
    // AI Creator page
    aiMediaCreator: 'AI Δημιουργός Πολυμέσων',
    startNewProject: 'Ξεκινήστε νέο έργο',
    projectDetails: 'Λεπτομέρειες Έργου',
    basicInfo: 'Βασικές πληροφορίες',
    createWithAi: 'Δημιουργία με AI',
    describeVision: 'Περιγράψτε το όραμά σας',
    review: 'Επισκόπηση',
    finalCheck: 'Τελικός έλεγχος',
    videoProduction: 'Παραγωγή Βίντεο',
    photoShoot: 'Φωτογράφιση',
    graphicDesign: 'Γραφιστικός Σχεδιασμός',
    brandContent: 'Περιεχόμενο Μάρκας',
    showMockup: 'Δείξε μου ένα mockup',
    makeMoreProfessional: 'Κάνε το πιο επαγγελματικό',
    addMoreDetails: 'Πρόσθεσε περισσότερες λεπτομέρειες',
    suggestAlternatives: 'Πρότεινε εναλλακτικές',
    planMyScenes: 'Σχεδίασε τις σκηνές μου',
    suggestShotTypes: 'Πρότεινε τύπους λήψης',
    exportProject: 'Εξαγωγή Έργου',
    copiedToClipboard: 'Αντιγράφηκε στο πρόχειρο',
    mockupGenerated: 'Το mockup δημιουργήθηκε επιτυχώς!',
    pdfExportedSuccess: 'Το PDF εξήχθη επιτυχώς!',
    failedToExportPdf: 'Αποτυχία εξαγωγής PDF',
    // Features page
    featureUsage: 'Χρήση Χαρακτηριστικών & Συνδρομή',
    monitorUsage: 'Παρακολουθήστε τη χρήση και διαχειριστείτε τη συνδρομή σας',
    aiMediaCreation: 'Δημιουργία Πολυμέσων AI',
    generateBriefs: 'Δημιουργήστε briefs έργων με τον AI βοηθό',
    mockupGeneration: 'Δημιουργία Mockups',
    createMockups: 'Δημιουργήστε οπτικά mockups και concepts',
    customOrders: 'Προσαρμοσμένες Παραγγελίες',
    submitRequests: 'Υποβάλετε αιτήματα προσαρμοσμένων έργων',
    brandAssets: 'Assets Μάρκας',
    storeManageFiles: 'Αποθηκεύστε και διαχειριστείτε τα αρχεία της μάρκας σας',
    prioritySupport: 'Υποστήριξη Προτεραιότητας',
    dedicatedSupport: 'Λάβετε αφοσιωμένη υποστήριξη από την ομάδα μας',
    usageHistory: 'Ιστορικό Χρήσης',
    trackUsageTime: 'Παρακολουθήστε τη χρήση σας στο χρόνο',
    totalUsesMonth: 'Συνολικές χρήσεις αυτό τον μήνα',
    subscriptionPlans: 'Πλάνα Συνδρομής',
    choosePlan: 'Επιλέξτε πλάνο για να συνεχίσετε',
    free: 'Δωρεάν',
    premium: 'Premium',
    premiumOnly: 'Μόνο Premium',
    notAvailableFree: 'Μη διαθέσιμο στο δωρεάν πλάνο',
    whatsIncluded: 'Τι περιλαμβάνεται:',
    upgradeToPremium: 'Αναβάθμιση σε Premium',
    dedicatedManager: 'Αφοσιωμένος διαχειριστής λογαριασμού',
    priorityQueue: 'Προτεραιότητα σε όλες τις παραγγελίες σας',
    responseGuarantee: 'Εγγύηση απόκρισης 24 ωρών',
    exclusiveAccess: 'Αποκλειστική πρόσβαση σε νέα χαρακτηριστικά',
    unlimitedRevisions: 'Απεριόριστες αναθεωρήσεις σε όλα τα έργα',
    unlimited: 'Απεριόριστο',
    perMonth: 'ανά μήνα',
    files: 'αρχεία',
    included: 'Περιλαμβάνεται',
  },
  sv: {
    settings: 'Inställningar',
    profile: 'Profil',
    personalization: 'Anpassning',
    team: 'Team',
    availability: 'Tillgänglighet',
    notifications: 'Notifikationer',
    privacy: 'Integritet',
    language: 'Språk',
    calendar: 'Kalender',
    fullName: 'Fullständigt Namn',
    displayName: 'Visningsnamn',
    email: 'E-post',
    phone: 'Telefon',
    location: 'Plats',
    website: 'Webbplats',
    save: 'Spara',
    saving: 'Sparar...',
    cancel: 'Avbryt',
    appearance: 'Utseende',
    aiAgent: 'AI-Assistent',
    businessProfile: 'Företagsprofil',
    personalData: 'Personuppgifter',
    theme: 'Tema',
    lightMode: 'Ljust Läge',
    darkMode: 'Mörkt Läge',
    colorTheme: 'Färgtema',
    conversationTone: 'Samtalston',
    responseLength: 'Svarslängd',
    languagePreference: 'Språkinställning',
    professional: 'Professionell',
    friendly: 'Vänlig',
    casual: 'Avslappnad',
    short: 'Kort',
    medium: 'Medium',
    detailed: 'Detaljerad',
    orderUpdates: 'Orderuppdateringar',
    promotions: 'Kampanjer',
    systemAlerts: 'Systemvarningar',
    comments: 'Kommentarer',
    mentions: 'Omnämnanden',
    enabled: 'Aktiverad',
    disabled: 'Inaktiverad',
    interfaceLanguage: 'Gränssnittsspråk',
    selectLanguage: 'Välj ditt föredragna språk',
    languageDescription: 'Välj språk för applikationsgränssnittet',
    loading: 'Laddar...',
    error: 'Fel',
    success: 'Framgång',
    comingSoon: 'Kommer Snart',
    viewAll: 'Visa Alla',
    search: 'Sök',
    view: 'Visa',
    delete: 'Ta bort',
    load: 'Ladda',
    refresh: 'Uppdatera',
    dashboard: 'Instrumentpanel',
    welcome: 'Välkommen',
    welcomeBack: 'Välkommen tillbaka',
    orders: 'Beställningar',
    products: 'Produkter',
    wishlist: 'Önskelista',
    home: 'Hem',
    shop: 'Butik',
    about: 'Om Oss',
    contact: 'Kontakt',
    logout: 'Logga Ut',
    login: 'Logga In',
    signup: 'Registrera',
    aiCreator: 'AI-Skapare',
    scenePlans: 'Scenplaner',
    features: 'Funktioner',
    totalOrders: 'Totala Beställningar',
    activeOrders: 'Aktiva Beställningar',
    member: 'Medlem',
    admin: 'Admin',
    portal: 'Portal',
    adminView: 'Adminvy',
    memberView: 'Medlemsvy',
    personal: 'Personligt',
    shopSection: 'Butik',
    account: 'Konto',
    quickActions: 'Snabbåtgärder',
    newOrder: 'Ny Beställning',
    browseShop: 'Bläddra i Butiken',
    viewWishlist: 'Visa Önskelista',
    manageSettings: 'Hantera Inställningar',
    items: 'artiklar',
    unread: 'olästa',
    active: 'aktiva',
    total: 'totalt',
    askAiAnything: 'Fråga AI...',
    generateIdeas: 'Generera Idéer',
    createContent: 'Skapa Innehåll',
    goodMorning: 'God morgon',
    goodAfternoon: 'God eftermiddag',
    goodEvening: 'God kväll',
    hereToHelp: 'Här är vad du kan göra idag',
    // Orders page
    myOrders: 'Mina Beställningar',
    trackManageOrders: 'Spåra och hantera alla dina beställningar på ett ställe',
    enableNotifications: 'Aktivera Notifikationer',
    notificationsOn: 'Notifikationer På',
    exportPdf: 'Exportera PDF',
    noOrdersToExport: 'Inga beställningar att exportera',
    pdfDownloaded: 'PDF nedladdad!',
    orderHistoryExported: 'Din beställningshistorik har exporterats.',
    notificationsEnabled: 'Notifikationer aktiverade!',
    orderStatusUpdates: 'Du kommer att få uppdateringar när din orderstatus ändras.',
    notificationsBlocked: 'Notifikationer blockerade',
    enableInBrowser: 'Aktivera notifikationer i dina webbläsarinställningar.',
    orderPlaced: 'Beställning Lagd',
    accepted: 'Accepterad',
    workingOnIt: 'Arbetar På Det',
    previewSent: 'Förhandsgranskning Skickad',
    orderSent: 'Beställning Skickad',
    delivered: 'Levererad',
    cancelled: 'Avbruten',
    confirmed: 'Bekräftad',
    processing: 'Bearbetar',
    all: 'Alla',
    pending: 'Väntande',
    inProgress: 'Pågående',
    shipped: 'Skickad',
    orderNumber: 'Beställning',
    tracking: 'Spårning',
    noOrdersFound: 'Inga beställningar hittades',
    noOrdersYet: 'Du har inte lagt några beställningar än',
    noFilteredOrders: 'Inga beställningar',
    startShopping: 'Börja Handla',
    // Wishlist page
    myWishlist: 'Min Önskelista',
    itemsSavedForLater: 'Artiklar du har sparat för senare',
    removedFromWishlist: 'borttagen från önskelistan',
    addedToCart: 'Tillagd i kundvagnen',
    addToCart: 'Lägg i Kundvagn',
    outOfStock: 'Slut i Lager',
    wishlistEmpty: 'Din önskelista är tom',
    saveItemsHeart: 'Spara artiklar genom att klicka på hjärtikonen',
    browseShopButton: 'Bläddra i Butiken',
    // Shop page
    shopTitle: 'Butik',
    shopDescription: 'Utforska våra premiumprodukter, mallar och tjänster för ditt varumärke.',
    requestCustomWork: 'Begär Anpassat Arbete',
    cart: 'Kundvagn',
    quickView: 'Snabbvy',
    addedToWishlist: 'Tillagd i önskelistan',
    removedFromWishlistShort: 'Borttagen från önskelistan',
    uncategorized: 'Okategoriserad',
    needSomethingCustom: 'Behöver du något anpassat?',
    customWorkDescription: 'Hittade du inte vad du söker? Berätta om ditt projekt.',
    physical: 'Fysisk',
    digital: 'Digital',
    service: 'Tjänst',
    // Notifications page
    allCaughtUp: 'Allt uppdaterat!',
    unreadNotifications: 'oläst notifikation',
    markAllAsRead: 'Markera alla som lästa',
    noNotifications: 'Inga notifikationer',
    notifyWhenImportant: 'Vi meddelar dig när något viktigt händer',
    viewDetails: 'Visa detaljer',
    markAsRead: 'Markera som läst',
    // Scene Plans page
    savedScenePlans: 'Sparade Scenplaner',
    viewManageScenePlans: 'Visa, hantera och exportera dina genererade scenplaner',
    createNew: 'Skapa Ny',
    searchScenePlans: 'Sök scenplaner...',
    scenes: 'scener',
    noMatchingPlans: 'Inga matchande scenplaner',
    noSavedPlans: 'Inga sparade scenplaner ännu',
    tryDifferentSearch: 'Prova ett annat sökord',
    generateFirstPlan: 'Generera din första scenplan i AI-Skaparen',
    goToAiCreator: 'Gå till AI-Skaparen',
    deleteScenePlan: 'Ta bort Scenplan?',
    deleteScenePlanConfirm: 'Detta tar permanent bort scenplanen. Denna åtgärd kan inte ångras.',
    scenePlanDeleted: 'Scenplan borttagen',
    pdfDownloadedSuccess: 'PDF nedladdad',
    // AI Creator page
    aiMediaCreator: 'AI-Mediaskapare',
    startNewProject: 'Starta nytt projekt',
    projectDetails: 'Projektdetaljer',
    basicInfo: 'Grundläggande information',
    createWithAi: 'Skapa med AI',
    describeVision: 'Beskriv din vision',
    review: 'Granska',
    finalCheck: 'Slutkontroll',
    videoProduction: 'Videoproduktion',
    photoShoot: 'Fotografering',
    graphicDesign: 'Grafisk Design',
    brandContent: 'Varumärkesinnehåll',
    showMockup: 'Visa mig en mockup',
    makeMoreProfessional: 'Gör det mer professionellt',
    addMoreDetails: 'Lägg till fler detaljer',
    suggestAlternatives: 'Föreslå alternativ',
    planMyScenes: 'Planera mina scener',
    suggestShotTypes: 'Föreslå bildtyper',
    exportProject: 'Exportera Projekt',
    copiedToClipboard: 'Kopierat till urklipp',
    mockupGenerated: 'Mockup genererad!',
    pdfExportedSuccess: 'PDF exporterad!',
    failedToExportPdf: 'Kunde inte exportera PDF',
    // Features page
    featureUsage: 'Funktionsanvändning & Medlemskap',
    monitorUsage: 'Övervaka din funktionsanvändning och hantera din prenumeration',
    aiMediaCreation: 'AI-Mediaskapande',
    generateBriefs: 'Generera projektbeskrivningar med vår AI-assistent',
    mockupGeneration: 'Mockup-Generering',
    createMockups: 'Skapa visuella mockups och koncept',
    customOrders: 'Anpassade Beställningar',
    submitRequests: 'Skicka in anpassade projektförfrågningar',
    brandAssets: 'Varumärkestillgångar',
    storeManageFiles: 'Lagra och hantera dina varumärkesfiler',
    prioritySupport: 'Prioritetssupport',
    dedicatedSupport: 'Få dedikerad support från vårt team',
    usageHistory: 'Användningshistorik',
    trackUsageTime: 'Spåra din funktionsanvändning över tid',
    totalUsesMonth: 'Totala användningar denna månad',
    subscriptionPlans: 'Prenumerationsplaner',
    choosePlan: 'Välj en plan för att fortsätta',
    free: 'Gratis',
    premium: 'Premium',
    premiumOnly: 'Endast Premium',
    notAvailableFree: 'Inte tillgänglig i gratisplanen',
    whatsIncluded: 'Vad som ingår:',
    upgradeToPremium: 'Uppgradera till Premium',
    dedicatedManager: 'Dedikerad kontohanterare för dina projekt',
    priorityQueue: 'Prioritetskö för alla dina beställningar',
    responseGuarantee: '24-timmars svarstidsgaranti',
    exclusiveAccess: 'Exklusiv tillgång till nya funktioner',
    unlimitedRevisions: 'Obegränsade revisioner på alla projekt',
    unlimited: 'Obegränsat',
    perMonth: 'per månad',
    files: 'filer',
    included: 'Ingår',
  },
  es: {
    settings: 'Configuración',
    profile: 'Perfil',
    personalization: 'Personalización',
    team: 'Equipo',
    availability: 'Disponibilidad',
    notifications: 'Notificaciones',
    privacy: 'Privacidad',
    language: 'Idioma',
    calendar: 'Calendario',
    fullName: 'Nombre Completo',
    displayName: 'Nombre de Usuario',
    email: 'Correo Electrónico',
    phone: 'Teléfono',
    location: 'Ubicación',
    website: 'Sitio Web',
    save: 'Guardar',
    saving: 'Guardando...',
    cancel: 'Cancelar',
    appearance: 'Apariencia',
    aiAgent: 'Asistente IA',
    businessProfile: 'Perfil Empresarial',
    personalData: 'Datos Personales',
    theme: 'Tema',
    lightMode: 'Modo Claro',
    darkMode: 'Modo Oscuro',
    colorTheme: 'Tema de Color',
    conversationTone: 'Tono de Conversación',
    responseLength: 'Longitud de Respuesta',
    languagePreference: 'Preferencia de Idioma',
    professional: 'Profesional',
    friendly: 'Amigable',
    casual: 'Casual',
    short: 'Corto',
    medium: 'Medio',
    detailed: 'Detallado',
    orderUpdates: 'Actualizaciones de Pedidos',
    promotions: 'Promociones',
    systemAlerts: 'Alertas del Sistema',
    comments: 'Comentarios',
    mentions: 'Menciones',
    enabled: 'Habilitado',
    disabled: 'Deshabilitado',
    interfaceLanguage: 'Idioma de la Interfaz',
    selectLanguage: 'Selecciona tu idioma preferido',
    languageDescription: 'Elige el idioma para la interfaz de la aplicación',
    loading: 'Cargando...',
    error: 'Error',
    success: 'Éxito',
    comingSoon: 'Próximamente',
    viewAll: 'Ver Todo',
    search: 'Buscar',
    view: 'Ver',
    delete: 'Eliminar',
    load: 'Cargar',
    refresh: 'Actualizar',
    dashboard: 'Panel de Control',
    welcome: 'Bienvenido',
    welcomeBack: 'Bienvenido de nuevo',
    orders: 'Pedidos',
    products: 'Productos',
    wishlist: 'Lista de Deseos',
    home: 'Inicio',
    shop: 'Tienda',
    about: 'Acerca de',
    contact: 'Contacto',
    logout: 'Cerrar Sesión',
    login: 'Iniciar Sesión',
    signup: 'Registrarse',
    aiCreator: 'Creador IA',
    scenePlans: 'Planes de Escena',
    features: 'Características',
    totalOrders: 'Pedidos Totales',
    activeOrders: 'Pedidos Activos',
    member: 'Miembro',
    admin: 'Admin',
    portal: 'Portal',
    adminView: 'Vista de Admin',
    memberView: 'Vista de Miembro',
    personal: 'Personal',
    shopSection: 'Tienda',
    account: 'Cuenta',
    quickActions: 'Acciones Rápidas',
    newOrder: 'Nuevo Pedido',
    browseShop: 'Explorar Tienda',
    viewWishlist: 'Ver Lista de Deseos',
    manageSettings: 'Gestionar Configuración',
    items: 'artículos',
    unread: 'sin leer',
    active: 'activos',
    total: 'total',
    askAiAnything: 'Pregunta a la IA...',
    generateIdeas: 'Generar Ideas',
    createContent: 'Crear Contenido',
    goodMorning: 'Buenos días',
    goodAfternoon: 'Buenas tardes',
    goodEvening: 'Buenas noches',
    hereToHelp: 'Esto es lo que puedes hacer hoy',
    // Orders page
    myOrders: 'Mis Pedidos',
    trackManageOrders: 'Rastrea y gestiona todos tus pedidos en un solo lugar',
    enableNotifications: 'Activar Notificaciones',
    notificationsOn: 'Notificaciones Activas',
    exportPdf: 'Exportar PDF',
    noOrdersToExport: 'No hay pedidos para exportar',
    pdfDownloaded: '¡PDF descargado!',
    orderHistoryExported: 'Tu historial de pedidos ha sido exportado.',
    notificationsEnabled: '¡Notificaciones activadas!',
    orderStatusUpdates: 'Recibirás actualizaciones cuando cambie el estado de tu pedido.',
    notificationsBlocked: 'Notificaciones bloqueadas',
    enableInBrowser: 'Habilita las notificaciones en la configuración del navegador.',
    orderPlaced: 'Pedido Realizado',
    accepted: 'Aceptado',
    workingOnIt: 'En Proceso',
    previewSent: 'Vista Previa Enviada',
    orderSent: 'Pedido Enviado',
    delivered: 'Entregado',
    cancelled: 'Cancelado',
    confirmed: 'Confirmado',
    processing: 'Procesando',
    all: 'Todos',
    pending: 'Pendiente',
    inProgress: 'En Progreso',
    shipped: 'Enviado',
    orderNumber: 'Pedido',
    tracking: 'Seguimiento',
    noOrdersFound: 'No se encontraron pedidos',
    noOrdersYet: 'Aún no has realizado ningún pedido',
    noFilteredOrders: 'Sin pedidos',
    startShopping: 'Empezar a Comprar',
    // Wishlist page
    myWishlist: 'Mi Lista de Deseos',
    itemsSavedForLater: 'Artículos que has guardado para después',
    removedFromWishlist: 'eliminado de la lista de deseos',
    addedToCart: 'Añadido al carrito',
    addToCart: 'Añadir al Carrito',
    outOfStock: 'Agotado',
    wishlistEmpty: 'Tu lista de deseos está vacía',
    saveItemsHeart: 'Guarda artículos haciendo clic en el icono del corazón',
    browseShopButton: 'Explorar Tienda',
    // Shop page
    shopTitle: 'Tienda',
    shopDescription: 'Explora nuestros productos premium, plantillas y servicios para tu marca.',
    requestCustomWork: 'Solicitar Trabajo Personalizado',
    cart: 'Carrito',
    quickView: 'Vista Rápida',
    addedToWishlist: 'Añadido a la lista de deseos',
    removedFromWishlistShort: 'Eliminado de la lista de deseos',
    uncategorized: 'Sin categoría',
    needSomethingCustom: '¿Necesitas algo personalizado?',
    customWorkDescription: '¿No encuentras lo que buscas? Cuéntanos sobre tu proyecto.',
    physical: 'Físico',
    digital: 'Digital',
    service: 'Servicio',
    // Notifications page
    allCaughtUp: '¡Todo al día!',
    unreadNotifications: 'notificación sin leer',
    markAllAsRead: 'Marcar todo como leído',
    noNotifications: 'Sin notificaciones',
    notifyWhenImportant: 'Te notificaremos cuando ocurra algo importante',
    viewDetails: 'Ver detalles',
    markAsRead: 'Marcar como leído',
    // Scene Plans page
    savedScenePlans: 'Planes de Escena Guardados',
    viewManageScenePlans: 'Ver, gestionar y exportar tus planes de escena generados',
    createNew: 'Crear Nuevo',
    searchScenePlans: 'Buscar planes de escena...',
    scenes: 'escenas',
    noMatchingPlans: 'No hay planes de escena coincidentes',
    noSavedPlans: 'Aún no hay planes de escena guardados',
    tryDifferentSearch: 'Prueba con otro término de búsqueda',
    generateFirstPlan: 'Genera tu primer plan de escena en el Creador IA',
    goToAiCreator: 'Ir al Creador IA',
    deleteScenePlan: '¿Eliminar Plan de Escena?',
    deleteScenePlanConfirm: 'Esto eliminará permanentemente el plan de escena. Esta acción no se puede deshacer.',
    scenePlanDeleted: 'Plan de escena eliminado',
    pdfDownloadedSuccess: 'PDF descargado con éxito',
    // AI Creator page
    aiMediaCreator: 'Creador de Medios IA',
    startNewProject: 'Iniciar nuevo proyecto',
    projectDetails: 'Detalles del Proyecto',
    basicInfo: 'Información básica',
    createWithAi: 'Crear con IA',
    describeVision: 'Describe tu visión',
    review: 'Revisar',
    finalCheck: 'Comprobación final',
    videoProduction: 'Producción de Video',
    photoShoot: 'Sesión Fotográfica',
    graphicDesign: 'Diseño Gráfico',
    brandContent: 'Contenido de Marca',
    showMockup: 'Muéstrame un mockup',
    makeMoreProfessional: 'Hazlo más profesional',
    addMoreDetails: 'Añade más detalles',
    suggestAlternatives: 'Sugiere alternativas',
    planMyScenes: 'Planifica mis escenas',
    suggestShotTypes: 'Sugiere tipos de toma',
    exportProject: 'Exportar Proyecto',
    copiedToClipboard: 'Copiado al portapapeles',
    mockupGenerated: '¡Mockup generado con éxito!',
    pdfExportedSuccess: '¡PDF exportado con éxito!',
    failedToExportPdf: 'Error al exportar PDF',
    // Features page
    featureUsage: 'Uso de Funciones y Membresía',
    monitorUsage: 'Monitorea el uso de tus funciones y gestiona tu suscripción',
    aiMediaCreation: 'Creación de Medios IA',
    generateBriefs: 'Genera briefs de proyectos con nuestro asistente IA',
    mockupGeneration: 'Generación de Mockups',
    createMockups: 'Crea mockups visuales y conceptos',
    customOrders: 'Pedidos Personalizados',
    submitRequests: 'Envía solicitudes de proyectos personalizados',
    brandAssets: 'Activos de Marca',
    storeManageFiles: 'Almacena y gestiona tus archivos de marca',
    prioritySupport: 'Soporte Prioritario',
    dedicatedSupport: 'Obtén soporte dedicado de nuestro equipo',
    usageHistory: 'Historial de Uso',
    trackUsageTime: 'Rastrea el uso de tus funciones a lo largo del tiempo',
    totalUsesMonth: 'Usos totales este mes',
    subscriptionPlans: 'Planes de Suscripción',
    choosePlan: 'Elige un plan para continuar',
    free: 'Gratis',
    premium: 'Premium',
    premiumOnly: 'Solo Premium',
    notAvailableFree: 'No disponible en el plan gratuito',
    whatsIncluded: 'Qué incluye:',
    upgradeToPremium: 'Actualizar a Premium',
    dedicatedManager: 'Gestor de cuenta dedicado para tus proyectos',
    priorityQueue: 'Cola prioritaria para todos tus pedidos',
    responseGuarantee: 'Garantía de respuesta en 24 horas',
    exclusiveAccess: 'Acceso exclusivo a nuevas funciones',
    unlimitedRevisions: 'Revisiones ilimitadas en todos los proyectos',
    unlimited: 'Ilimitado',
    perMonth: 'por mes',
    files: 'archivos',
    included: 'Incluido',
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: Translations;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [language, setLanguageState] = useState<Language>('en');
  const [isLoading, setIsLoading] = useState(true);

  // Load language preference
  useEffect(() => {
    const loadLanguage = async () => {
      setIsLoading(true);
      
      // First try localStorage for quick initial load
      const storedLang = localStorage.getItem('preferred_language') as Language;
      if (storedLang && translations[storedLang]) {
        setLanguageState(storedLang);
      }

      // Then try to load from database if user is logged in
      if (user) {
        try {
          const { data } = await supabase
            .from('user_settings')
            .select('interface_language')
            .eq('user_id', user.id)
            .single();
          
          if (data?.interface_language && translations[data.interface_language as Language]) {
            setLanguageState(data.interface_language as Language);
            localStorage.setItem('preferred_language', data.interface_language);
          }
        } catch (error) {
          console.error('Error loading language preference:', error);
        }
      }
      
      setIsLoading(false);
    };

    loadLanguage();
  }, [user]);

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('preferred_language', lang);

    // Save to database if user is logged in
    if (user) {
      try {
        await supabase
          .from('user_settings')
          .upsert({
            user_id: user.id,
            interface_language: lang,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id',
          });
      } catch (error) {
        console.error('Error saving language preference:', error);
      }
    }
  };

  const value = {
    language,
    setLanguage,
    t: translations[language],
    isLoading,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
