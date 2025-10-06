const mongoose = require('mongoose');

// Address sub-schema
const addressSchema = new mongoose.Schema({
  street: {
    type: String,
    required: [true, 'Street address is required'],
    trim: true,
    maxlength: [200, 'Street address cannot exceed 200 characters']
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true,
    maxlength: [100, 'City cannot exceed 100 characters']
  },
  state: {
    type: String,
    required: [true, 'State is required'],
    trim: true,
    maxlength: [50, 'State cannot exceed 50 characters']
  },
  zipCode: {
    type: String,
    required: [true, 'Zip code is required'],
    trim: true,
    maxlength: [20, 'Zip code cannot exceed 20 characters']
  },
  country: {
    type: String,
    required: [true, 'Country is required'],
    trim: true,
    default: 'USA',
    maxlength: [100, 'Country cannot exceed 100 characters']
  }
}, { _id: false });

// Contact info sub-schema
const contactInfoSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    validate: {
      validator: function(v) {
        return /^[\+]?[1-9][\d]{0,15}$/.test(v.replace(/[\s\-\(\)]/g, ''));
      },
      message: 'Please enter a valid phone number'
    }
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
      },
      message: 'Please enter a valid email address'
    }
  },
  website: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        if (!v) return true; // Optional field
        return /^https?:\/\/.+\..+/.test(v);
      },
      message: 'Please enter a valid website URL'
    }
  }
}, { _id: false });

// Branding sub-schema
const brandingSchema = new mongoose.Schema({
  primaryColor: {
    type: String,
    required: [true, 'Primary color is required'],
    default: '#2563eb',
    validate: {
      validator: function(v) {
        return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
      },
      message: 'Please enter a valid hex color code'
    }
  },
  secondaryColor: {
    type: String,
    required: [true, 'Secondary color is required'],
    default: '#64748b',
    validate: {
      validator: function(v) {
        return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
      },
      message: 'Please enter a valid hex color code'
    }
  },
  accentColor: {
    type: String,
    required: [true, 'Accent color is required'],
    default: '#f59e0b',
    validate: {
      validator: function(v) {
        return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
      },
      message: 'Please enter a valid hex color code'
    }
  },
  logoUrl: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        if (!v) return true; // Optional field
        return /^https?:\/\/.+/.test(v) || /^\//.test(v);
      },
      message: 'Please enter a valid URL or path'
    }
  },
  faviconUrl: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        if (!v) return true; // Optional field
        return /^https?:\/\/.+/.test(v) || /^\//.test(v);
      },
      message: 'Please enter a valid URL or path'
    }
  },
  customCSS: {
    type: String,
    trim: true,
    maxlength: [10000, 'Custom CSS cannot exceed 10000 characters']
  },
  emailSignature: {
    type: String,
    trim: true,
    maxlength: [5000, 'Email signature cannot exceed 5000 characters']
  }
}, { _id: false });

// Password policy sub-schema
const passwordPolicySchema = new mongoose.Schema({
  minLength: {
    type: Number,
    required: true,
    min: [6, 'Minimum password length must be at least 6'],
    max: [50, 'Minimum password length cannot exceed 50'],
    default: 8
  },
  requireUppercase: {
    type: Boolean,
    default: true
  },
  requireLowercase: {
    type: Boolean,
    default: true
  },
  requireNumbers: {
    type: Boolean,
    default: true
  },
  requireSpecialChars: {
    type: Boolean,
    default: true
  },
  maxAge: {
    type: Number,
    min: [30, 'Password max age must be at least 30 days'],
    max: [365, 'Password max age cannot exceed 365 days'],
    default: 90
  }
}, { _id: false });

// Backup settings sub-schema
const backupSettingsSchema = new mongoose.Schema({
  enabled: {
    type: Boolean,
    default: true
  },
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    default: 'daily'
  },
  retentionDays: {
    type: Number,
    min: [7, 'Retention period must be at least 7 days'],
    max: [365, 'Retention period cannot exceed 365 days'],
    default: 30
  },
  includeFiles: {
    type: Boolean,
    default: true
  }
}, { _id: false });

// System config sub-schema
const systemConfigSchema = new mongoose.Schema({
  timezone: {
    type: String,
    required: true,
    default: 'America/New_York'
  },
  dateFormat: {
    type: String,
    required: true,
    default: 'MM/DD/YYYY'
  },
  timeFormat: {
    type: String,
    enum: ['12h', '24h'],
    required: true,
    default: '12h'
  },
  currency: {
    type: String,
    required: true,
    default: 'USD',
    maxlength: [3, 'Currency code must be 3 characters']
  },
  language: {
    type: String,
    required: true,
    default: 'en',
    maxlength: [5, 'Language code cannot exceed 5 characters']
  },
  defaultPageSize: {
    type: Number,
    required: true,
    min: [10, 'Default page size must be at least 10'],
    max: [100, 'Default page size cannot exceed 100'],
    default: 20
  },
  sessionTimeout: {
    type: Number,
    required: true,
    min: [5, 'Session timeout must be at least 5 minutes'],
    max: [480, 'Session timeout cannot exceed 480 minutes (8 hours)'],
    default: 30
  },
  enableNotifications: {
    type: Boolean,
    default: true
  },
  enableEmailAlerts: {
    type: Boolean,
    default: true
  },
  enableSMSAlerts: {
    type: Boolean,
    default: false
  },
  maintenanceMode: {
    type: Boolean,
    default: false
  },
  allowUserRegistration: {
    type: Boolean,
    default: false
  },
  requireEmailVerification: {
    type: Boolean,
    default: true
  },
  passwordPolicy: {
    type: passwordPolicySchema,
    required: true,
    default: () => ({})
  },
  backupSettings: {
    type: backupSettingsSchema,
    required: true,
    default: () => ({})
  }
}, { _id: false });

// Features sub-schema
const featuresSchema = new mongoose.Schema({
  userManagement: {
    type: Boolean,
    default: true
  },
  buildingManagement: {
    type: Boolean,
    default: true
  },
  equipmentManagement: {
    type: Boolean,
    default: true
  },
  meterManagement: {
    type: Boolean,
    default: true
  },
  contactManagement: {
    type: Boolean,
    default: true
  },
  emailTemplates: {
    type: Boolean,
    default: true
  },
  reporting: {
    type: Boolean,
    default: true
  },
  analytics: {
    type: Boolean,
    default: true
  },
  mobileApp: {
    type: Boolean,
    default: false
  },
  apiAccess: {
    type: Boolean,
    default: true
  }
}, { _id: false });

// Integrations sub-schema
const integrationsSchema = new mongoose.Schema({
  emailProvider: {
    type: String,
    trim: true
  },
  smsProvider: {
    type: String,
    trim: true
  },
  paymentProcessor: {
    type: String,
    trim: true
  },
  calendarSync: {
    type: Boolean,
    default: false
  },
  weatherAPI: {
    type: Boolean,
    default: false
  },
  mapProvider: {
    type: String,
    default: 'google',
    trim: true
  }
}, { _id: false });

// Main CompanySettings schema
const companySettingsSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    maxlength: [200, 'Company name cannot exceed 200 characters']
  },
  logo: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        if (!v) return true; // Optional field
        // Allow URLs, paths, and base64 data URLs
        return /^https?:\/\/.+/.test(v) || /^\//.test(v) || /^data:image\//.test(v);
      },
      message: 'Please enter a valid URL, path, or base64 image data'
    }
  },
  address: {
    type: addressSchema,
    required: true
  },
  contactInfo: {
    type: contactInfoSchema,
    required: true
  },
  branding: {
    type: brandingSchema,
    required: true,
    default: () => ({})
  },
  systemConfig: {
    type: systemConfigSchema,
    required: true,
    default: () => ({})
  },
  features: {
    type: featuresSchema,
    required: true,
    default: () => ({})
  },
  integrations: {
    type: integrationsSchema,
    required: true,
    default: () => ({})
  }
}, {
  timestamps: true
});

// Transform _id to id for frontend compatibility
companySettingsSchema.methods.toJSON = function () {
  const settings = this.toObject();
  
  // Transform _id to id
  if (settings._id) {
    settings.id = settings._id.toString();
    delete settings._id;
  }
  delete settings.__v;

  return settings;
};

// Static method to create default settings
companySettingsSchema.statics.createDefaultSettings = function() {
  return new this({
    name: 'Facility Management Company',
    address: {
      street: '123 Business Center Dr',
      city: 'Business City',
      state: 'BC',
      zipCode: '12345',
      country: 'USA'
    },
    contactInfo: {
      phone: '555-0100',
      email: 'info@company.com',
      website: 'https://company.com'
    },
    branding: {
      primaryColor: '#2563eb',
      secondaryColor: '#64748b',
      accentColor: '#f59e0b',
      logoUrl: '/assets/logo.png',
      faviconUrl: '/assets/favicon.ico',
      customCSS: '',
      emailSignature: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <p><strong>Facility Management Company</strong></p>
          <p>123 Business Center Dr<br>Business City, BC 12345</p>
          <p>Phone: 555-0100 | Email: info@company.com</p>
          <p><a href="https://company.com">www.company.com</a></p>
        </div>
      `.trim()
    },
    systemConfig: {
      timezone: 'America/New_York',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
      currency: 'USD',
      language: 'en',
      defaultPageSize: 20,
      sessionTimeout: 30,
      enableNotifications: true,
      enableEmailAlerts: true,
      enableSMSAlerts: false,
      maintenanceMode: false,
      allowUserRegistration: false,
      requireEmailVerification: true,
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        maxAge: 90
      },
      backupSettings: {
        enabled: true,
        frequency: 'daily',
        retentionDays: 30,
        includeFiles: true
      }
    },
    features: {
      userManagement: true,
      buildingManagement: true,
      equipmentManagement: true,
      meterManagement: true,
      contactManagement: true,
      emailTemplates: true,
      reporting: true,
      analytics: true,
      mobileApp: false,
      apiAccess: true
    },
    integrations: {
      emailProvider: 'smtp',
      smsProvider: null,
      paymentProcessor: null,
      calendarSync: false,
      weatherAPI: false,
      mapProvider: 'google'
    }
  });
};

// Static method to get or create settings (singleton pattern)
companySettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  
  if (!settings) {
    settings = this.createDefaultSettings();
    await settings.save();
  }
  
  return settings;
};

// Index for performance (though we only expect one document)
companySettingsSchema.index({ name: 1 });

module.exports = mongoose.model('CompanySettings', companySettingsSchema);