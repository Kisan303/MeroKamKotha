import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Joyride, { Step, CallBackProps } from 'react-joyride';
import { useLocation } from 'wouter';

interface TourContextType {
  startTour: (page: string) => void;
  endTour: () => void;
  setTourComplete: (page: string) => void;
  isTourComplete: (page: string) => boolean;
}

const TourContext = createContext<TourContextType | null>(null);

// Tour steps for different pages
const tourSteps: Record<string, Step[]> = {
  '/': [
    {
      target: '.post-list',
      content: 'Welcome to your dashboard! Here you can browse through available rooms and job listings. Posts are organized by date and relevance.',
      disableBeacon: true,
      placement: 'bottom',
    },
    {
      target: '.create-post-button',
      content: 'Click here to create a new post. You can list a room for rent or post a job opportunity.',
      placement: 'bottom-start',
    },
    {
      target: '.search-bar',
      content: 'Use the search bar to find specific listings by keywords, location, or price range.',
      placement: 'bottom',
    },
    {
      target: '.filter-section',
      content: 'Filter posts by type (room/job), price range, and location to find exactly what you\'re looking for.',
      placement: 'right',
    },
  ],
  '/chat': [
    {
      target: '.chat-list',
      content: 'Your conversations appear here. Green dots indicate users who are currently online.',
      disableBeacon: true,
      placement: 'right',
    },
    {
      target: '.online-status',
      content: 'Keep track of who\'s online. A green dot means they\'re available to chat right now.',
      placement: 'right',
    },
    {
      target: '.chat-messages',
      content: 'Your conversation history appears here. Messages are organized by date and include read receipts.',
      placement: 'left',
    },
    {
      target: '.chat-input',
      content: 'Type your message here and press Enter or click the send button to start chatting.',
      placement: 'top',
    }
  ],
  '/profile': [
    {
      target: '.profile-header',
      content: 'This is your profile section. Here you can view and edit your personal information.',
      disableBeacon: true,
      placement: 'bottom',
    },
    {
      target: '.user-posts',
      content: 'All your posted listings appear here. You can edit or delete your posts anytime.',
      placement: 'right',
    },
    {
      target: '.bookmarks',
      content: 'Quick access to posts you\'ve saved. Bookmarked items are private to you.',
      placement: 'left',
    },
    {
      target: '.chat-history',
      content: 'View your recent conversations and continue where you left off.',
      placement: 'bottom',
    }
  ],
  '/create-post': [
    {
      target: '.post-type-selector',
      content: 'Choose whether you\'re posting a room for rent or a job opportunity.',
      disableBeacon: true,
      placement: 'bottom',
    },
    {
      target: '.post-details',
      content: 'Fill in the details about your listing. Be specific to attract the right people.',
      placement: 'right',
    },
    {
      target: '.image-upload',
      content: 'For room listings, add up to 5 high-quality images to showcase the space.',
      placement: 'right',
    },
    {
      target: '.location-picker',
      content: 'Set the exact location. This helps people find listings in their preferred area.',
      placement: 'top',
    }
  ],
  '/about': [
    {
      target: '.platform-info',
      content: 'Learn about our platform\'s mission and how we connect people with rooms and opportunities.',
      disableBeacon: true,
      placement: 'bottom',
    },
    {
      target: '.features-section',
      content: 'Discover all the features available to help you find or list rooms and jobs.',
      placement: 'right',
    },
    {
      target: '.contact-section',
      content: 'Need help? Find our contact information and support resources here.',
      placement: 'top',
    }
  ]
};

export function TourProvider({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [isRunning, setIsRunning] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);
  const [completedTours, setCompletedTours] = useState<Set<string>>(
    new Set(JSON.parse(localStorage.getItem('completedTours') || '[]'))
  );

  const startTour = (page: string) => {
    if (!tourSteps[page] || completedTours.has(page)) return;
    setSteps(tourSteps[page]);
    setIsRunning(true);
  };

  const endTour = () => {
    setIsRunning(false);
    setSteps([]);
  };

  const setTourComplete = (page: string) => {
    const newCompletedTours = new Set(completedTours).add(page);
    setCompletedTours(newCompletedTours);
    localStorage.setItem('completedTours', JSON.stringify([...newCompletedTours]));
  };

  const isTourComplete = (page: string) => completedTours.has(page);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, type } = data;
    if (status === 'finished' || status === 'skipped') {
      setTourComplete(location);
      endTour();
    }
  };

  // Start tour automatically when visiting a new page
  useEffect(() => {
    if (!completedTours.has(location)) {
      startTour(location);
    }
  }, [location]);

  return (
    <TourContext.Provider value={{ startTour, endTour, setTourComplete, isTourComplete }}>
      <Joyride
        steps={steps}
        run={isRunning}
        continuous
        showProgress
        showSkipButton
        hideCloseButton={false}
        callback={handleJoyrideCallback}
        styles={{
          options: {
            primaryColor: 'var(--primary)',
            textColor: 'var(--foreground)',
            backgroundColor: 'var(--background)',
            overlayColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1000,
          },
          tooltip: {
            fontSize: '14px',
            padding: '20px',
          },
          tooltipTitle: {
            fontSize: '16px',
            fontWeight: 'bold',
            marginBottom: '10px',
          },
          buttonNext: {
            fontSize: '14px',
            padding: '8px 16px',
          },
          buttonBack: {
            fontSize: '14px',
            padding: '8px 16px',
            marginRight: '8px',
          },
          buttonSkip: {
            fontSize: '14px',
            padding: '8px 16px',
          },
        }}
      />
      {children}
    </TourContext.Provider>
  );
}

export function useTour() {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
}