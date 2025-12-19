"""
Metro Price Monitor - Automatisches Auslesen von Preisen nach Login
Nutzt Playwright für Browser-Automation
"""

from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout
import json
import time
from datetime import datetime
from pathlib import Path
import os

from dotenv import load_dotenv
load_dotenv()

class MetroPriceMonitor:
    def __init__(self, username: str, password: str, headless: bool = True):
        self.username = username
        self.password = password
        self.headless = headless
        self.browser = None
        self.context = None
        self.page = None
        
    def start_browser(self):
        """Startet den Browser und erstellt eine neue Session"""
        self.playwright = sync_playwright().start()
        
        # Browser mit persistentem Context für Cookies
        self.browser = self.playwright.chromium.launch(
            headless=self.headless,
            args=['--disable-blink-features=AutomationControlled']
        )
        
        # Context mit realistischen Browser-Eigenschaften
        self.context = self.browser.new_context(
            viewport={'width': 1620, 'height': 1080},
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        )
        
        self.page = self.context.new_page()
        
    def login(self):
        """Führt den Login bei Metro durch"""
        print("🔐 Starte Login...")

        # Zur Login-Seite navigieren
        self.page.goto("https://produkte.metro.de/shop/pv/BTY-X697339/0032/0021/", wait_until="domcontentloaded")
        time.sleep(4)

        try:
            self.page.click("text=Alles ablehnen", timeout=5000)
            # input("Alles ablehnen geklickt")
        except:
            print("⚠️Cookie Banner nicht gefunden")
            self.page.screenshot(path="test.png", full_page=True)

        # Login-Button/Link finden und klicken
        # Hinweis: Die Selektoren müssen ggf. angepasst werden!
        try:
            self.page.click("text=Login", timeout=5000)
            # input("Login-Button geklickt")
        except:
            raise Exception("⚠️ Login-Button nicht gefunden")

        time.sleep(4)

        # Username eingeben
        username_selector = 'input[type="email"], input[id*="user_id"]'
        self.page.fill(username_selector, self.username)

        # Password eingeben
        password_selector = '#password'
        self.page.fill(password_selector, self.password)

        # Login-Button klicken
        submit_selector = 'button[type="submit"], button:has-text("Anmelden")'
        self.page.click(submit_selector)

        # Warten bis Login erfolgreich (z.B. auf Dashboard oder Account-Element)
        # self.page.wait_for_load_state("networkidle", timeout=10000)
        time.sleep(8)
        print("✅ Login erfolgreich!")
        return True

    
    def save_session(self, filename: str = "metro_session.json"):
        """Speichert Cookies für spätere Wiederverwendung"""
        cookies = self.context.cookies()
        with open(filename, 'w') as f:
            json.dump(cookies, f)
        print(f"💾 Session gespeichert in: {filename}")

    def get_cookies(self):
        return self.context.cookies()
    
    def load_session(self, filename: str = "metro_session.json"):
        """Lädt gespeicherte Cookies"""
        try:
            with open(filename, 'r') as f:
                cookies = json.load(f)
            self.context.add_cookies(cookies)
            print("✅ Session geladen")
            return True
        except FileNotFoundError:
            print("⚠️ Keine gespeicherte Session gefunden")
            return False
    
    def close(self):
        """Schließt Browser und räumt auf"""
        if self.context:
            self.context.close()
        if self.browser:
            self.browser.close()
        if hasattr(self, 'playwright'):
            self.playwright.stop()
        print("👋 Browser geschlossen")


# Beispiel-Nutzung
if __name__ == "__main__":
    # Konfiguration
    USERNAME = os.environ["USERNAME"]
    PASSWORD = os.environ["PASSWORD"]
    
    # Monitor starten
    monitor = MetroPriceMonitor(
        username=USERNAME,
        password=PASSWORD,
        headless=False  # True für Hintergrund-Betrieb
    )
    
    try:
        monitor.start_browser()
        
        if monitor.login():
            monitor.save_session()
        
        
        # Produkte überwachen
        #results = monitor.monitor_products(PRODUCT_URLS)
        
        # Ergebnisse anzeigen
        #print("\n📈 Monitoring-Ergebnisse:")
        #print("=" * 60)
        #for product in results:
        #    print(f"Produkt: {product['name']}")
        #    print(f"Preis: {product['price']}")
        #    print(f"Verfügbar: {product['available']}")
        #    print(f"Zeitstempel: {product['timestamp']}")
        #    print("-" * 60)
        
    finally:
        monitor.close()