/**
 * Homepage Content Configuration
 * 
 * This file controls all content for the homepage. You can:
 * 1. Set source to "DATABASE" to pull content from database
 * 2. Set source to "FALLBACK" to use the fallback content defined here
 * 3. Edit fallback content directly in this file
 * 4. Switch sources easily by changing the source value
 */

import { COMPANY_INFO, LOGO_ASSETS } from '@/lib/constants/company-details'

// Types for content configuration
type ContentSource = 'DATABASE' | 'FALLBACK'

interface DatabaseConfig {
  table: string
  recordId: string
  idColumn: string
  valueColumn: string
}

interface ContentItem {
  source: ContentSource
  database?: DatabaseConfig
  fallback: any
}

// Main homepage content configuration
export const homepageContent = {
  // ===== NAVIGATION SECTION =====
  navigation: {
    brand: {
      name: {
        source: 'FALLBACK' as ContentSource,
        fallback: COMPANY_INFO.tradingName
      },
      logo: {
        source: 'FALLBACK' as ContentSource,
        fallback: LOGO_ASSETS.placeholder.svg
      }
    },
    menuItems: {
      source: 'FALLBACK' as ContentSource,
      fallback: [
        { name: 'Events', href: '/functions' },
        { name: 'About', href: '/about' },
        { name: 'Contact', href: '/contact' },
        { name: 'Help', href: '/help' }
      ]
    },
    authLink: {
      text: {
        source: 'FALLBACK' as ContentSource,
        fallback: 'Log in'
      },
      href: {
        source: 'FALLBACK' as ContentSource,
        fallback: '/login'
      }
    }
  },

  // ===== HERO SECTION =====
  hero: {
    title: {
      source: 'DATABASE' as ContentSource,
      database: {
        table: 'functions',
        recordId: process.env.FEATURED_FUNCTION_ID || '',
        idColumn: 'function_id',
        valueColumn: 'name'
      },
      fallback: 'Welcome to LodgeTix'
    },
    subtitle: {
      source: 'FALLBACK' as ContentSource,
      fallback: 'Your premier destination for Masonic events and ticketing'
    },
    description: {
      source: 'DATABASE' as ContentSource,
      database: {
        table: 'functions',
        recordId: process.env.FEATURED_FUNCTION_ID || '',
        idColumn: 'function_id',
        valueColumn: 'description'
      },
      fallback: 'Join us for memorable occasions and timeless traditions. Experience the brotherhood, ceremony, and fellowship that makes Freemasonry special.'
    },
    image: {
      url: {
        source: 'DATABASE' as ContentSource,
        database: {
          table: 'functions',
          recordId: process.env.FEATURED_FUNCTION_ID || '',
          idColumn: 'function_id',
          valueColumn: 'image_url'
        },
        fallback: '/placeholder.svg?height=800&width=800'
      },
      alt: {
        source: 'DATABASE' as ContentSource,
        database: {
          table: 'functions',
          recordId: process.env.FEATURED_FUNCTION_ID || '',
          idColumn: 'function_id',
          valueColumn: 'name'
        },
        fallback: 'Masonic Lodge Interior'
      },
      position: {
        source: 'FALLBACK' as ContentSource,
        fallback: 'center' // Options: 'center', 'top', 'bottom', 'left', 'right'
      }
    },
    backgroundOverlay: {
      source: 'FALLBACK' as ContentSource,
      fallback: 'bg-masonic-blue/30'
    },
    badge: {
      text: {
        source: 'FALLBACK' as ContentSource,
        fallback: 'Sydney Masonic Centre, 19-21 September 2025'
      },
      linkText: {
        source: 'FALLBACK' as ContentSource,
        fallback: 'Learn more'
      },
      linkHref: {
        source: 'FALLBACK' as ContentSource,
        fallback: '/about'
      }
    },
    buttons: {
      primary: {
        text: {
          source: 'FALLBACK' as ContentSource,
          fallback: 'Get Tickets'
        },
        href: {
          source: 'DATABASE' as ContentSource,
          database: {
            table: 'functions',
            recordId: process.env.FEATURED_FUNCTION_ID || '',
            idColumn: 'function_id',
            valueColumn: 'slug'
          },
          fallback: '/functions'
        }
      },
      secondary: {
        text: {
          source: 'FALLBACK' as ContentSource,
          fallback: 'Learn more'
        },
        href: {
          source: 'FALLBACK' as ContentSource,
          fallback: '/functions'
        }
      }
    }
  },

  // ===== SPONSORS SECTION =====
  sponsors: {
    title: {
      source: 'FALLBACK' as ContentSource,
      fallback: 'The United Grand Lodge of New South Wales & the Australian Capital Territory'
    },
    items: {
      source: 'FALLBACK' as ContentSource,
      fallback: [
        {
          name: 'United Grand Lodge of NSW & ACT',
          logo: 'https://api.lodgetix.io/storage/v1/object/public/public-events/website/hero-logos/1.png',
          alt: 'Freemasons NSW & ACT Logo'
        },
        {
          name: 'Centennary Seal',
          logo: 'https://api.lodgetix.io/storage/v1/object/public/public-events/website/hero-logos/2.png',
          alt: 'Centennary Seal Logo'
        },
        {
          name: 'Masonicare',
          logo: 'https://api.lodgetix.io/storage/v1/object/public/public-events/website/hero-logos/3.png',
          alt: 'Masonicare Logo'
        },
        {
          name: 'Grand Masters Coat of Arms',
          logo: 'https://api.lodgetix.io/storage/v1/object/public/public-events/website/hero-logos/4.png',
          alt: 'Coat of Arms'
        },
        {
          name: 'Sydney Masonic Centre',
          logo: 'https://api.lodgetix.io/storage/v1/object/public/public-events/website/hero-logos/5.png',
          alt: 'Sydney Masonic Centre Logo'
        }
      ]
    }
  },

  // ===== FEATURED EVENTS SECTION =====
  featuredEvents: {
    title: {
      source: 'FALLBACK' as ContentSource,
      fallback: 'Featured Events'
    },
    description: {
      source: 'FALLBACK' as ContentSource,
      fallback: 'Experience the finest in Masonic tradition and fellowship. Join us for these carefully curated events that celebrate our heritage and strengthen our community bonds.'
    },
    viewAllButton: {
      text: {
        source: 'FALLBACK' as ContentSource,
        fallback: 'View All Events'
      },
      href: {
        source: 'FALLBACK' as ContentSource,
        fallback: '/functions'
      }
    },
    eventsData: {
      source: 'DATABASE' as ContentSource,
      fallback: [
        {
          id: 'fallback-1',
          title: 'Grand Installation Ceremony',
          description: 'Join us for the annual Grand Installation Ceremony, a cornerstone event celebrating Masonic tradition and leadership.',
          date: 'Saturday, March 15, 2025',
          location: 'Masonic Centre, Sydney',
          imageUrl: '/placeholder.svg?height=400&width=1000&text=Grand+Installation',
          imagePosition: 'center', // Options: 'center', 'top', 'bottom', 'left', 'right', 'left-top', etc.
          price: 'From $150'
        },
        {
          id: 'fallback-2',
          title: 'Charity Gala Dinner',
          description: 'An elegant evening supporting local charities, featuring fine dining and entertainment in aid of worthy causes.',
          date: 'Friday, April 12, 2025',
          location: 'Grand Ballroom, Sydney',
          imageUrl: '/placeholder.svg?height=400&width=1000&text=Charity+Gala',
          imagePosition: 'center',
          price: 'From $200'
        }
      ]
    }
  },

  // ===== LOCATION INFO SECTION =====
  locationInfo: {
    badge: {
      source: 'FALLBACK' as ContentSource,
      fallback: 'Sydney Masonic Centre'
    },
    title: {
      source: 'FALLBACK' as ContentSource,
      fallback: 'Sacred Architecture, Living Tradition'
    },
    description: {
      source: 'FALLBACK' as ContentSource,
      fallback: 'Standing as a masterpiece of symbolic architecture, where Brutalist design meets ancient Masonic wisdom. Every element of the SMC speaks to our Crafts timeless teachings, welcoming Brethren into a building that is itself a lesson in stone.'
    },
    image: {
      url: {
        source: 'FALLBACK' as ContentSource,
        fallback: 'https://headbox-media.imgix.net/spaces/28866/photos/a907daca-5580-4c3c-896b-890ee147adec_Screen%20Shot%202022-04-20%20at%204.32.15%20pm.png?auto=format&ar=3%3A2&fit=crop&q=60&ixlib=react-9.5.4'
      },
      alt: {
        source: 'FALLBACK' as ContentSource,
        fallback: 'Masonic Lodge Hall Interior'
      },
      position: {
        source: 'FALLBACK' as ContentSource,
        fallback: 'center' // Options: 'center', 'top', 'bottom', 'left', 'right'
      }
    },
    features: {
      source: 'FALLBACK' as ContentSource,
      fallback: [
        {
          name: 'Architectural Symbolism',
          description: 'Ascend the winding stair from Goulburn Street to reach the mayble foyer, where twin circular elevators rise like the great pillars.',
          icon: 'MapPin'
        },
        {
          name: 'The Middle Chamber',
          description: 'Arrive at the marble foyer, and enter the Grand Lodge Room, where 600 masons & guests can gather beneath celestial lighting that mirrors the canopy of heaven',
          icon: 'Clock'
        },
        {
          name: 'Living Masonic Heritage',
          description: 'More than mere concrete and steel, this Brutalist landmark embodies our principles in its very form, inspiring contemplation of the Great Architects design.',
          icon: 'UserGroup'
        }
      ]
    }
  },

  // ===== CTA SECTION =====
  cta: {
    title: {
      source: 'FALLBACK' as ContentSource,
      fallback: 'Be Part of History'
    },
    description: {
      source: 'FALLBACK' as ContentSource,
      fallback: 'For over 135 years, Grand Installations and Proclamations of the Grand Master have marked defining moments in our Masonic journey.'
    },
    secondaryDescription: {
      source: 'FALLBACK' as ContentSource,
      fallback: 'Since Lord Carrington became our first Grand Master in 1888, these ceremonies have brought together Brethren right across New South Wales, Australia and Internationally to witness the continuity of leadership that guides our ancient craft.'
    },
    button: {
      text: {
        source: 'FALLBACK' as ContentSource,
        fallback: 'Explore Events'
      },
      href: {
        source: 'FALLBACK' as ContentSource,
        fallback: '/functions'
      }
    },
    images: {
      source: 'FALLBACK' as ContentSource,
      fallback: [
        {
          url: 'https://api.lodgetix.io/storage/v1/object/public/public-events/website/CTA/Ceremony%20p2%20socmed-469%20(1).jpg',
          alt: 'Masonic ceremony in progress',
          className: 'aspect-7/5 w-[37rem] max-w-none rounded-2xl bg-gray-50 object-cover',
          imagePosition: 'center'
        },
        {
          url: 'https://api.lodgetix.io/storage/v1/object/public/public-events/website/CTA/Ceremony%20p2%20socmed-133.jpg',
          alt: 'Lodge meeting with brethren',
          className: 'aspect-4/3 w-[24rem] max-w-none flex-none rounded-2xl bg-gray-50 object-cover',
          imagePosition: 'center'
        },
        {
          url: 'https://api.lodgetix.io/storage/v1/object/public/public-events/website/CTA/Banquet%20socmed-195.jpg',
          alt: 'Masonic charitable work',
          className: 'aspect-7/5 w-[37rem] max-w-none flex-none rounded-2xl bg-gray-50 object-cover',
          imagePosition: 'center'
        },
        {
          url: 'https://api.lodgetix.io/storage/v1/object/public/public-events/website/CTA/Fairwell%20socmed-179.jpg',
          alt: 'Historic lodge building',
          className: 'aspect-4/3 w-[24rem] max-w-none rounded-2xl bg-gray-50 object-cover',
          imagePosition: 'center'
        }
      ]
    }
  }
}

// Export types for TypeScript support
export type HomepageContent = typeof homepageContent
export type { ContentSource, DatabaseConfig, ContentItem }