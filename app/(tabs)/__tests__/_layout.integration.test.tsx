/**
 * Tab Layout Integration Test
 *
 * This test verifies that all tabs in the filesystem are properly registered
 * in the _layout.tsx configuration file. It catches issues like:
 * - Missing tab registration (causing default/broken icons)
 * - Duplicate tab registration
 * - Tabs without proper icon configuration
 */

import fs from 'fs';
import path from 'path';

describe('Tab Layout Configuration', () => {
  const tabsDir = path.join(__dirname, '..');
  const layoutFile = path.join(tabsDir, '_layout.tsx');

  // Get all tab directories
  const tabDirectories = fs
    .readdirSync(tabsDir)
    .filter((item) => {
      const fullPath = path.join(tabsDir, item);
      return (
        fs.statSync(fullPath).isDirectory() &&
        !item.startsWith('_') &&
        !item.startsWith('.')
      );
    });

  // Read layout file
  const layoutContent = fs.readFileSync(layoutFile, 'utf-8');

  it('should have all tab directories registered in _layout.tsx', () => {
    const expectedTabs = tabDirectories;

    expectedTabs.forEach((tabName) => {
      // Check if tab is registered in layout
      const tabRegistrationPattern = new RegExp(
        `<Tabs\\.Screen[\\s\\S]*?name="${tabName}"`,
        'g'
      );

      const isRegistered = tabRegistrationPattern.test(layoutContent);

      expect(isRegistered).toBe(true);
      if (!isRegistered) {
        console.error(
          `❌ Tab directory "${tabName}" exists but is not registered in _layout.tsx`
        );
        console.error(
          `   This will cause Expo Router to auto-generate a tab with a default/broken icon.`
        );
        console.error(
          `   Add this tab to _layout.tsx with proper configuration.`
        );
      }
    });
  });

  it('should have exactly 4 visible tabs and 4 hidden routes (8 total)', () => {
    const visibleTabs = ['play', 'leagues', 'history', 'menu'];
    const hiddenRoutes = ['players', 'custom-games', 'matches', 'series'];

    // Count Tabs.Screen occurrences
    const tabScreenPattern = /<Tabs\.Screen/g;
    const matches = layoutContent.match(tabScreenPattern);
    const tabCount = matches ? matches.length : 0;

    expect(tabCount).toBe(8); // 4 visible + 4 hidden
    expect(tabCount).toBe(visibleTabs.length + hiddenRoutes.length);

    if (tabCount !== 8) {
      console.error(
        `❌ Expected 8 total tab registrations (4 visible + 4 hidden), but found ${tabCount} in _layout.tsx`
      );
      console.error(
        `   This might indicate duplicate tabs or missing registrations.`
      );
    }
  });

  it('should configure visible tabs with titles', () => {
    const expectedTitles = {
      play: 'Play',
      leagues: 'Leagues',
      history: 'History',
      menu: 'Menu',
    };

    Object.entries(expectedTitles).forEach(([tabName, expectedTitle]) => {
      const titlePattern = new RegExp(
        `name="${tabName}"[\\s\\S]*?title:\\s*['"]${expectedTitle}['"]`,
        'g'
      );

      const hasTitle = titlePattern.test(layoutContent);

      expect(hasTitle).toBe(true);
      if (!hasTitle) {
        console.error(`❌ Tab "${tabName}" is missing title "${expectedTitle}"`);
      }
    });
  });

  it('should configure visible tabs with tabBarIcon', () => {
    const tabNames = ['play', 'leagues', 'history', 'menu'];

    tabNames.forEach((tabName) => {
      const iconPattern = new RegExp(
        `name="${tabName}"[\\s\\S]*?tabBarIcon:`,
        'g'
      );

      const hasIcon = iconPattern.test(layoutContent);

      expect(hasIcon).toBe(true);
      if (!hasIcon) {
        console.error(`❌ Tab "${tabName}" is missing tabBarIcon configuration`);
        console.error(
          `   Without an icon, the tab will show a default/broken icon.`
        );
      }
    });
  });

  it('should use Lucide icons for visible tabs', () => {
    // Check that TabBarIcon is used (which uses Lucide icons)
    const tabBarIconPattern = /<TabBarIcon/g;
    const matches = layoutContent.match(tabBarIconPattern);
    const iconCount = matches ? matches.length : 0;

    expect(iconCount).toBe(4); // One for each visible tab

    if (iconCount !== 4) {
      console.error(
        `❌ Expected 4 TabBarIcon components, but found ${iconCount}`
      );
    }

    // Verify Lucide icons are imported
    expect(layoutContent).toContain('lucide-react-native');
  });

  it('should hide old tabs with href: null', () => {
    const hiddenTabs = ['players', 'custom-games', 'matches', 'series'];

    hiddenTabs.forEach((tabName) => {
      const hrefNullPattern = new RegExp(
        `name="${tabName}"[\\s\\S]*?href:\\s*null`,
        'g'
      );

      const hasHrefNull = hrefNullPattern.test(layoutContent);

      expect(hasHrefNull).toBe(true);
      if (!hasHrefNull) {
        console.error(
          `❌ Tab "${tabName}" should be hidden with href: null but isn't`
        );
      }
    });
  });

  it('should not have duplicate tab registrations', () => {
    const allTabs = [
      'play',
      'leagues',
      'history',
      'menu',
      'players',
      'custom-games',
      'matches',
      'series',
    ];

    allTabs.forEach((tabName) => {
      // More specific pattern that only matches Tabs.Screen name attribute
      const namePattern = new RegExp(`<Tabs\\.Screen[\\s\\S]*?name="${tabName}"`, 'g');
      const matches = layoutContent.match(namePattern);
      const count = matches ? matches.length : 0;

      expect(count).toBe(1);
      if (count > 1) {
        console.error(
          `❌ Tab "${tabName}" is registered ${count} times (should be 1)`
        );
        console.error(`   This will cause multiple tabs to appear in the UI.`);
      }
    });
  });

  it('should have _layout.tsx for tabs with sub-routes', () => {
    // Check each tab directory for multiple route files
    tabDirectories.forEach((tabName) => {
      const tabPath = path.join(tabsDir, tabName);
      const files = fs.readdirSync(tabPath);

      // Count .tsx files (excluding _layout.tsx and __tests__)
      const routeFiles = files.filter(
        (file) =>
          file.endsWith('.tsx') &&
          !file.startsWith('_') &&
          !file.startsWith('.')
      );

      // If there are multiple route files, _layout.tsx must exist
      if (routeFiles.length > 1) {
        const layoutPath = path.join(tabPath, '_layout.tsx');
        const hasLayout = fs.existsSync(layoutPath);

        expect(hasLayout).toBe(true);
        if (!hasLayout) {
          console.error(
            `❌ Tab directory "${tabName}" has ${routeFiles.length} route files but no _layout.tsx`
          );
          console.error(`   Route files found: ${routeFiles.join(', ')}`);
          console.error(
            `   Without _layout.tsx, Expo Router will create separate tabs for each file.`
          );
          console.error(
            `   Create ${tabName}/_layout.tsx with a Stack or Tabs navigator.`
          );
        }
      }
    });
  });
});
