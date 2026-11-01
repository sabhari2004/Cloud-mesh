// Local persistent storage engine used as a seamless fallback when Firebase live credentials are not yet configured
const STORAGE_PREFIX = 'cloudmesh_';

const SEED_USERS = [
  {
    id: 'user_admin_01',
    uid: 'user_admin_01',
    email: 'admin@cloudmesh.org',
    displayName: 'Elena Rostova',
    phone: '+1 (555) 019-2831',
    location: 'Central District, Ward 4',
    role: 'admin',
    status: 'active',
    bio: 'Municipal Coordinator & CloudMesh Platform Administrator.',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'user_responder_01',
    uid: 'user_responder_01',
    email: 'responder@cloudmesh.org',
    displayName: 'Marcus Chen, EMT',
    phone: '+1 (555) 014-9923',
    location: 'Northside Rescue Base',
    role: 'responder',
    status: 'active',
    bio: 'Certified First Responder & Community Logistics Lead.',
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'user_citizen_01',
    uid: 'user_citizen_01',
    email: 'sarah.miller@example.com',
    displayName: 'Sarah Miller',
    phone: '+1 (555) 018-7744',
    location: 'Westside Pine Avenue',
    role: 'user',
    status: 'active',
    bio: 'Neighborhood mutual aid volunteer and community gardener.',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  }
];

const SEED_RESOURCES = [
  {
    id: 'res_001',
    title: 'Emergency Clean Drinking Water (Cases)',
    description: '15 unopened cases of purified drinking water (24 bottles/case) stored in cool, dry facility. Ready for immediate pickup or localized delivery for flood-affected families.',
    category: 'water',
    quantity: 15,
    unit: 'cases',
    availability: 'available',
    location: 'Westside Community Center, 42 Elm St',
    ownerId: 'user_citizen_01',
    ownerName: 'Sarah Miller',
    ownerContact: 'sarah.miller@example.com',
    contactPreferences: 'in_app',
    urgent: false,
    expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'res_002',
    title: 'Heavy Duty 4500W Portable Dual-Fuel Generator',
    description: 'Gasoline & propane dual-fuel generator with multiple 120V outlets. Full tank provided. Ideal for emergency medical devices or refrigeration during outages.',
    category: 'equipment',
    quantity: 1,
    unit: 'unit',
    availability: 'available',
    location: 'Northside Fire Auxiliary, 108 Oak Lane',
    ownerId: 'user_responder_01',
    ownerName: 'Marcus Chen, EMT',
    ownerContact: 'marcus.chen@example.com',
    contactPreferences: 'phone',
    urgent: true,
    expiryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'res_003',
    title: 'Certified Trauma First Aid Kits & Bleed Control',
    description: 'Comprehensive trauma bags containing CAT tourniquets, sterile gauze, compression bandages, antiseptic washes, splints, and emergency thermal blankets.',
    category: 'medical',
    quantity: 8,
    unit: 'kits',
    availability: 'partially_available',
    location: 'Central Clinic Hub, 300 Maple Blvd',
    ownerId: 'user_admin_01',
    ownerName: 'Elena Rostova',
    ownerContact: 'admin@cloudmesh.org',
    contactPreferences: 'in_app',
    urgent: true,
    expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'res_004',
    title: 'Non-Perishable Canned Food & High-Protein Meals',
    description: 'Assorted beans, hearty stews, canned fruit, and peanut butter. High shelf-life, vegetarian and non-vegetarian options available.',
    category: 'food',
    quantity: 40,
    unit: 'boxes',
    availability: 'available',
    location: 'Saint Jude Parish Hall, South Ave',
    ownerId: 'user_citizen_01',
    ownerName: 'Sarah Miller',
    ownerContact: 'sarah.miller@example.com',
    contactPreferences: 'in_app',
    urgent: false,
    expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'res_005',
    title: 'Temporary Heated Shelter Space (Up to 4 Persons)',
    description: 'Heated garage apartment with separate entrance, shower, and fold-out beds. Available for families displaced by storm damage.',
    category: 'shelter',
    quantity: 1,
    unit: 'room',
    availability: 'reserved',
    location: 'Highland Heights, 55 Crestview Dr',
    ownerId: 'user_citizen_01',
    ownerName: 'Sarah Miller',
    ownerContact: 'sarah.miller@example.com',
    contactPreferences: 'phone',
    urgent: true,
    expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'res_006',
    title: '4WD Cargo Truck with Driver for Supply Relocation',
    description: '4-wheel drive pickup with covered bed. Able to navigate flooded streets and debris to transport medical supplies or evacuate vulnerable residents.',
    category: 'transportation',
    quantity: 2,
    unit: 'vehicles',
    availability: 'available',
    location: 'Industrial Park Depot, Bay 7',
    ownerId: 'user_responder_01',
    ownerName: 'Marcus Chen, EMT',
    ownerContact: 'marcus.chen@example.com',
    contactPreferences: 'phone',
    urgent: false,
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  }
];

const SEED_REQUESTS = [
  {
    id: 'req_001',
    resourceId: 'res_005',
    resourceTitle: 'Temporary Heated Shelter Space (Up to 4 Persons)',
    resourceCategory: 'shelter',
    ownerId: 'user_citizen_01',
    ownerName: 'Sarah Miller',
    requesterId: 'user_responder_01',
    requesterName: 'Marcus Chen, EMT',
    requesterContact: 'marcus.chen@example.com',
    requestedQuantity: 1,
    neededByDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: 'Urgent placement needed for an elderly couple whose roof leaked during the flash storm.',
    status: 'accepted',
    decisionNotes: 'Confirmed space is sanitized and ready. Keys at North entrance.',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'req_002',
    resourceId: 'res_001',
    resourceTitle: 'Emergency Clean Drinking Water (Cases)',
    resourceCategory: 'water',
    ownerId: 'user_citizen_01',
    ownerName: 'Sarah Miller',
    requesterId: 'user_admin_01',
    requesterName: 'Elena Rostova',
    requesterContact: 'admin@cloudmesh.org',
    requestedQuantity: 3,
    neededByDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: 'For distribution at Senior Center where main water pressure is disrupted.',
    status: 'pending',
    decisionNotes: '',
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  }
];

const SEED_EMERGENCIES = [
  {
    id: 'emg_001',
    category: 'flood_storm',
    title: 'Flash Flood Inundation & Culvert Overflow',
    description: 'Rapidly rising water on lower Elm St blocking vehicular access to three residences. Water entering crawlspaces. Power lines sagging near roadway.',
    location: '400-450 Lower Elm Street, Ward 2',
    severity: 'critical',
    status: 'in_progress',
    reporterId: 'user_citizen_01',
    reporterName: 'Sarah Miller',
    reporterContact: '+1 (555) 018-7744',
    assignedTo: 'user_responder_01',
    assignedToName: 'Marcus Chen, EMT',
    responderNotes: 'Engine 3 and rescue pontoon on scene. 4 residents escorted to safety. Sandbagging underway.',
    immediateDanger: true,
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'emg_002',
    category: 'medical',
    title: 'Elderly Resident Oxygen Concentrator Low Battery',
    description: 'Neighborhood power outage lasting over 3 hours. Home oxygen backup cylinder has less than 45 minutes of reserve remaining. Need mobile power or replacement O2 cylinder.',
    location: '88 Meadowbrook Terrace, Apt 3B',
    severity: 'critical',
    status: 'assigned',
    reporterId: 'user_citizen_01',
    reporterName: 'Sarah Miller',
    reporterContact: '+1 (555) 018-7744',
    assignedTo: 'user_responder_01',
    assignedToName: 'Marcus Chen, EMT',
    responderNotes: 'Dispatched volunteer with portable 4500W generator and spare medical battery pack. ETA 12 mins.',
    immediateDanger: true,
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: 'emg_003',
    category: 'structural',
    title: 'Downed Oak Tree Obstructing Primary Evacuation Route',
    description: 'Large 40-foot oak tree fallen across Maple Boulevard. Both lanes fully obstructed. No injuries, but ambulance passage blocked.',
    location: 'Maple Blvd & 5th Avenue Intersection',
    severity: 'high',
    status: 'verified',
    reporterId: 'user_admin_01',
    reporterName: 'Elena Rostova',
    reporterContact: '+1 (555) 019-2831',
    assignedTo: null,
    assignedToName: null,
    responderNotes: 'Verified via municipal camera. Public works chainsaw crew notified.',
    immediateDanger: false,
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'emg_004',
    category: 'utility_outage',
    title: 'Substation Transformer Failure Affecting 800 Homes',
    description: 'Sudden transformer blowout following lightning strike. Darkened streetlights and residential heating units down in sub-freezing temperatures.',
    location: 'North Quadrant Grid Section 9',
    severity: 'medium',
    status: 'reported',
    reporterId: 'user_citizen_01',
    reporterName: 'Sarah Miller',
    reporterContact: '+1 (555) 018-7744',
    assignedTo: null,
    assignedToName: null,
    responderNotes: '',
    immediateDanger: false,
    timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
  }
];

const SEED_NOTIFICATIONS = [
  {
    id: 'notif_001',
    userId: 'user_citizen_01',
    title: 'Resource Request Received',
    message: 'Elena Rostova requested 3 cases of "Emergency Clean Drinking Water".',
    type: 'request_received',
    link: '/profile?tab=incoming',
    read: false,
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'notif_002',
    userId: 'user_responder_01',
    title: 'Request Approved!',
    message: 'Sarah Miller approved your request for "Temporary Heated Shelter Space".',
    type: 'request_update',
    link: '/profile?tab=requests',
    read: true,
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'notif_003',
    userId: 'user_responder_01',
    title: 'New Emergency Assigned',
    message: 'You have been assigned to critical report: "Elderly Resident Oxygen Concentrator Low Battery".',
    type: 'emergency_alert',
    link: '/emergency',
    read: false,
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  }
];

export const localStore = {
  get(collectionName, defaultData = []) {
    try {
      const item = localStorage.getItem(STORAGE_PREFIX + collectionName);
      if (!item) {
        this.set(collectionName, defaultData);
        return defaultData;
      }
      return JSON.parse(item);
    } catch (e) {
      console.warn(`Error reading ${collectionName} from localStorage:`, e);
      return defaultData;
    }
  },

  set(collectionName, data) {
    try {
      localStorage.setItem(STORAGE_PREFIX + collectionName, JSON.stringify(data));
    } catch (e) {
      console.warn(`Error writing ${collectionName} to localStorage:`, e);
    }
  },

  // Initialize all collections with seed data if not present
  initializeDefaults() {
    if (!localStorage.getItem(STORAGE_PREFIX + 'users')) {
      this.set('users', SEED_USERS);
    }
    if (!localStorage.getItem(STORAGE_PREFIX + 'resources')) {
      this.set('resources', SEED_RESOURCES);
    }
    if (!localStorage.getItem(STORAGE_PREFIX + 'resourceRequests')) {
      this.set('resourceRequests', SEED_REQUESTS);
    }
    if (!localStorage.getItem(STORAGE_PREFIX + 'emergencyReports')) {
      this.set('emergencyReports', SEED_EMERGENCIES);
    }
    if (!localStorage.getItem(STORAGE_PREFIX + 'notifications')) {
      this.set('notifications', SEED_NOTIFICATIONS);
    }
  },

  resetToDefault() {
    this.set('users', SEED_USERS);
    this.set('resources', SEED_RESOURCES);
    this.set('resourceRequests', SEED_REQUESTS);
    this.set('emergencyReports', SEED_EMERGENCIES);
    this.set('notifications', SEED_NOTIFICATIONS);
  }
};

// Automatically seed on load
localStore.initializeDefaults();
