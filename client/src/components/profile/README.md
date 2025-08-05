# Profile Components

This directory contains reusable components for building profile and settings pages. All components follow a consistent design system and can be used throughout the application.

## Components

### 1. `UserAvatar`
A flexible avatar component that displays user profile pictures or default avatars. Automatically optimizes Google avatar URLs for the requested size.

**Props:**
- `src?: string` - Image URL (automatically optimized for Google avatars)
- `alt: string` - Alt text for accessibility
- `size?: 'sm' | 'md' | 'lg' | 'xl'` - Size variant (default: 'lg')
- `className?: string` - Additional CSS classes

**Size Mapping:**
- `sm`: 32px (w-8 h-8)
- `md`: 48px (w-12 h-12) 
- `lg`: 64px (w-16 h-16)
- `xl`: 176px (w-44 h-44)

**Google Avatar Optimization:**
The component automatically detects Google avatar URLs (containing `googleusercontent.com` and `=s`) and adjusts the size parameter to match the component size for optimal image quality.

**Example:**
- Input: `https://lh3.googleusercontent.com/a/ACg8ocLC58MqniYCLKCs7_ROUkWGqeCjTOIPQA6sjEnyTGBQaZ7lz3W8=s96-c`
- Output for `size="xl"`: `https://lh3.googleusercontent.com/a/ACg8ocLC58MqniYCLKCs7_ROUkWGqeCjTOIPQA6sjEnyTGBQaZ7lz3W8=s176-c`

**Usage:**
```tsx
import { UserAvatar } from '../components/profile';

<UserAvatar 
  src={user.picture} 
  alt={user.name} 
  size="xl" 
/>
```

### 2. `ProfileCard`
A styled container component for consistent card layouts.

**Props:**
- `children: React.ReactNode` - Card content
- `className?: string` - Additional CSS classes
- `noPadding?: boolean` - Remove default padding

### 3. `ProfileHeader`
Header component with navigation and action buttons.

**Props:**
- `onBackClick: () => void` - Back button handler
- `onLogout: () => void` - Logout button handler
- `onThemeToggle?: () => void` - Optional theme toggle handler

### 4. `UserInfo`
Displays user information including name, email, and plan type.

**Props:**
- `name: string` - User's display name
- `email?: string` - User's email address
- `avatarUrl?: string` - Profile picture URL
- `planType?: string` - Subscription plan (default: 'Free Plan')

### 5. `MessageUsageCard`
Shows current message usage statistics with progress bar.

**Props:**
- `usage: { current: number; total: number; remaining: number; resetTime: string }`

### 6. `KeyboardShortcutsCard`
Displays keyboard shortcuts in a formatted list.

**Props:**
- `shortcuts?: KeyboardShortcut[]` - Array of shortcut objects (optional, uses defaults)

### 7. `NavigationTabs`
Tab navigation component for profile sections.

**Props:**
- `tabs?: Tab[]` - Array of tab objects (optional, uses defaults)
- `onTabClick?: (tabId: string) => void` - Tab click handler

### 8. `UpgradeCard`
Promotional card for plan upgrades with pricing and features.

**Props:**
- `price?: number` - Monthly price (default: 10)
- `period?: string` - Billing period (default: 'month')
- `features?: PlanFeature[]` - Array of feature objects
- `onUpgradeClick?: () => void` - Upgrade button handler
- `disclaimer?: string` - Fine print text

### 9. `DangerZone`
Warning section for destructive actions like account deletion.

**Props:**
- `onDeleteAccount?: () => void` - Delete button handler
- `title?: string` - Section title (default: 'Danger Zone')
- `description?: string` - Warning description
- `buttonText?: string` - Button label (default: 'Delete Account')

## Usage Example

```tsx
import React from 'react';
import {
  ProfileHeader,
  UserInfo,
  MessageUsageCard,
  KeyboardShortcutsCard,
  NavigationTabs,
  UpgradeCard,
  DangerZone
} from '../components/profile';

const MyProfilePage = () => {
  const handleLogout = () => { /* ... */ };
  const handleBack = () => { /* ... */ };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-100 to-primary-200">
      <ProfileHeader onBackClick={handleBack} onLogout={handleLogout} />
      
      <div className="max-w-6xl mx-auto p-6">
        <UserInfo name="John Doe" email="john@example.com" />
        <MessageUsageCard usage={{ current: 5, total: 20, remaining: 15, resetTime: 'Tomorrow' }} />
        <KeyboardShortcutsCard />
        <NavigationTabs />
        <UpgradeCard />
        <DangerZone />
      </div>
    </div>
  );
};
```

## Design System

All components follow the application's design system:
- **Colors**: Uses the `primary-*` color palette
- **Typography**: Consistent font weights and sizes
- **Spacing**: Uses Tailwind's spacing scale
- **Borders**: Subtle borders with `border-primary-200/30`
- **Backgrounds**: Glass-morphism effect with `bg-white/80 backdrop-blur-sm`

## Accessibility

- All interactive elements have proper focus states
- Images include alt text
- Keyboard navigation is supported
- Color contrast meets WCAG guidelines