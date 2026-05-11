import { Tabs } from 'expo-router';
import React from 'react';
import { View, Text, Pressable, useColorScheme } from 'react-native';
import { Link, usePathname, type Href } from 'expo-router';
import { NotificationBell } from '@/shared/components/composed/NotificationBell';

type NavLink = { href: Href; label: string };

/** 웹 상단 Header 네비게이션 — 탭바 대신 수평 링크 표시 */
function WebHeader() {
  const isDark = useColorScheme() === 'dark';
  const pathname = usePathname();

  const navLinks: NavLink[] = [
    { href: '/', label: '홈' },
    { href: '/create' as Href, label: '글쓰기' },
    { href: '/my' as Href, label: '나' },
  ];

  return (
    <View
      className={`flex-row items-center justify-between px-6 py-3 border-b ${
        isDark ? 'bg-stone-950 border-stone-800' : 'bg-white border-stone-200'
      }`}
      style={{ position: 'sticky' as never, top: 0, zIndex: 50 }}>
      {/* 브랜드 */}
      <Link href="/" asChild>
        <Pressable>
          <Text className={`text-lg font-bold ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
            은둔마을
          </Text>
        </Pressable>
      </Link>

      {/* 네비게이션 링크 */}
      <View className="flex-row items-center gap-2">
        {navLinks.map(({ href, label }) => {
          const hrefStr = typeof href === 'string' ? href : '';
          const isActive =
            pathname === hrefStr || (hrefStr !== '/' && pathname.startsWith(hrefStr));
          return (
            <Link key={hrefStr} href={href} asChild>
              <Pressable
                className={`px-4 py-2 rounded-lg ${
                  isActive
                    ? isDark
                      ? 'bg-stone-700 text-stone-100'
                      : 'bg-stone-100 text-stone-900'
                    : ''
                }`}>
                <Text
                  className={`text-sm font-medium ${
                    isActive
                      ? isDark
                        ? 'text-stone-100'
                        : 'text-stone-900'
                      : isDark
                        ? 'text-stone-400'
                        : 'text-stone-500'
                  }`}>
                  {label}
                </Text>
              </Pressable>
            </Link>
          );
        })}
        <NotificationBell />
      </View>
    </View>
  );
}

export default function WebTabLayout() {
  return (
    <>
      <WebHeader />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: 'none' },
        }}>
        <Tabs.Screen name="index" />
        <Tabs.Screen name="search" />
        <Tabs.Screen name="create" />
        <Tabs.Screen name="my" />
      </Tabs>
    </>
  );
}
