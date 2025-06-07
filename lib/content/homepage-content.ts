/**
 * Homepage Content Configuration
 * 
 * This file controls all content for the homepage. You can:
 * 1. Set source to "DATABASE" to pull content from database
 * 2. Set source to "FALLBACK" to use the fallback content defined here
 * 3. Edit fallback content directly in this file
 * 4. Switch sources easily by changing the source value
 */

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
        fallback: 'LodgeTix'
      },
      logo: {
        source: 'FALLBACK' as ContentSource,
        fallback: '/masonic-logo.svg' // Update this path to your actual logo
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
      }
    },
    backgroundOverlay: {
      source: 'FALLBACK' as ContentSource,
      fallback: 'bg-masonic-blue/30'
    },
    badge: {
      text: {
        source: 'FALLBACK' as ContentSource,
        fallback: 'United Grand Lodge of NSW & ACT official ticketing platform.'
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
      fallback: 'Proudly supported by Masonic organizations across NSW & ACT'
    },
    items: {
      source: 'FALLBACK' as ContentSource,
      fallback: [
        {
          name: 'United Grand Lodge of NSW & ACT',
          logo: '/placeholder.svg?height=48&width=158&text=UGL',
          alt: 'United Grand Lodge of NSW & ACT Logo'
        },
        {
          name: 'Masonic Care NSW',
          logo: '/placeholder.svg?height=48&width=158&text=Care',
          alt: 'Masonic Care NSW Logo'
        },
        {
          name: 'Freemasons Foundation',
          logo: '/placeholder.svg?height=48&width=158&text=Foundation',
          alt: 'Freemasons Foundation Logo'
        },
        {
          name: 'Royal Arch Chapter',
          logo: '/placeholder.svg?height=48&width=158&text=Royal+Arch',
          alt: 'Royal Arch Chapter Logo'
        },
        {
          name: 'Mark Master Masons',
          logo: '/placeholder.svg?height=48&width=158&text=Mark',
          alt: 'Mark Master Masons Logo'
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
          price: 'From $150'
        },
        {
          id: 'fallback-2',
          title: 'Charity Gala Dinner',
          description: 'An elegant evening supporting local charities, featuring fine dining and entertainment in aid of worthy causes.',
          date: 'Friday, April 12, 2025',
          location: 'Grand Ballroom, Sydney',
          imageUrl: '/placeholder.svg?height=400&width=1000&text=Charity+Gala',
          price: 'From $200'
        }
      ]
    }
  },

  // ===== LOCATION INFO SECTION =====
  locationInfo: {
    badge: {
      source: 'FALLBACK' as ContentSource,
      fallback: 'Experience Excellence'
    },
    title: {
      source: 'FALLBACK' as ContentSource,
      fallback: 'Premium Venues, Perfect Experiences'
    },
    description: {
      source: 'FALLBACK' as ContentSource,
      fallback: 'Our events are hosted at carefully selected venues throughout NSW & ACT, ensuring every occasion meets the highest standards of quality, accessibility, and Masonic tradition.'
    },
    image: {
      url: {
        source: 'FALLBACK' as ContentSource,
        fallback: '/placeholder.svg?height=600&width=800&text=Lodge+Hall'
      },
      alt: {
        source: 'FALLBACK' as ContentSource,
        fallback: 'Masonic Lodge Hall Interior'
      }
    },
    features: {
      source: 'FALLBACK' as ContentSource,
      fallback: [
        {
          name: 'Prime Locations',
          description: 'Our events are held at prestigious venues across NSW & ACT, offering convenient access and parking for all attendees.',
          icon: 'MapPin'
        },
        {
          name: 'Convenient Timing',
          description: 'Events are scheduled to accommodate working schedules, with both evening and weekend options available.',
          icon: 'Clock'
        },
        {
          name: 'Community Focused',
          description: 'Join a welcoming community of Masons and guests from across the region, building lasting friendships and connections.',
          icon: 'UserGroup'
        }
      ]
    }
  },

  // ===== CTA SECTION =====
  cta: {
    title: {
      source: 'FALLBACK' as ContentSource,
      fallback: 'Join Our Community'
    },
    description: {
      source: 'FALLBACK' as ContentSource,
      fallback: 'Become part of a tradition that spans centuries. Experience the brotherhood, ceremony, and fellowship that makes Freemasonry a cornerstone of community life.'
    },
    secondaryDescription: {
      source: 'FALLBACK' as ContentSource,
      fallback: 'From intimate lodge meetings to grand installations, our events offer opportunities to connect with like-minded individuals, participate in meaningful ceremonies, and contribute to charitable causes that make a difference in our communities.'
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
          url: '/placeholder.svg?height=400&width=592&text=Ceremony',
          alt: 'Masonic ceremony in progress',
          className: 'aspect-7/5 w-[37rem] max-w-none rounded-2xl bg-gray-50 object-cover'
        },
        {
          url: '/placeholder.svg?height=604&width=768&text=Lodge+Meeting',
          alt: 'Lodge meeting with brethren',
          className: 'aspect-4/3 w-[24rem] max-w-none flex-none rounded-2xl bg-gray-50 object-cover'
        },
        {
          url: '/placeholder.svg?height=842&width=1152&text=Charity+Work',
          alt: 'Masonic charitable work',
          className: 'aspect-7/5 w-[37rem] max-w-none flex-none rounded-2xl bg-gray-50 object-cover'
        },
        {
          url: '/placeholder.svg?height=604&width=768&text=Historic+Lodge',
          alt: 'Historic lodge building',
          className: 'aspect-4/3 w-[24rem] max-w-none rounded-2xl bg-gray-50 object-cover'
        }
      ]
    }
  }
}

// Export types for TypeScript support
export type HomepageContent = typeof homepageContent
export type { ContentSource, DatabaseConfig, ContentItem }