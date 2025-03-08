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
      content: 'Here you can see all available rooms and job listings.',
      disableBeacon: true,
    },
    {
      target: '.create-post-button',
      content: 'Click here to create a new post for a room or job.',
    },
    {
      target: '.search-bar',
      content: 'Use the search bar to find specific listings.',
    },
  ],
  '/chat': [
    {
      target: '.chat-list',
      content: 'Here you can see all your conversations.',
      disableBeacon: true,
    },
    {
      target: '.online-status',
      content: 'Green dot indicates when users are online.',
    },
    {
      target: '.chat-messages',
      content: 'Your messages will appear here. Click on a chat to start messaging.',
    },
  ],
  '/profile': [
    {
      target: '.user-info',
      content: 'This is your profile information.',
      disableBeacon: true,
    },
    {
      target: '.user-posts',
      content: 'Your posted listings will appear here.',
    },
    {
      target: '.bookmarks',
      content: 'Find your saved listings in this section.',
    },
  ],
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
        callback={handleJoyrideCallback}
        styles={{
          options: {
            primaryColor: 'var(--primary)',
            textColor: 'var(--foreground)',
            backgroundColor: 'var(--background)',
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
