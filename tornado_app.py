"""
Tornado & Vortex Simulation - Interaktive 2D Physik-Simulation
Entwickelt für Schüler*innen der 8. Klasse (IT-AG).
Verwendung: Pygame
Installation: pip install pygame

Steuerung:
- Maus bewegen: Bewegt das Wirbelzentrum (den Tornado-Sog).
- Linke Maustaste gedrückt halten: Erzeugt Implosions-Partikel (Sog nach innen und oben).
- Rechte Maustaste gedrückt halten: Erzeugt Explosions-Partikel (nach außen fliegende Teilchen).
- Leertaste: Löscht alle aktuellen Partikel.
- ESC oder Fenster schließen: Beendet das Programm.
"""

import math
import random
import sys

try:
    import pygame
except ImportError:
    print("Fehler: Pygame ist nicht installiert.")
    print("Bitte installieren Sie Pygame mit folgendem Befehl im Terminal:")
    print("pip install pygame")
    sys.exit(1)

# --- Bildschirm- und Fenstereinstellungen ---
FENSTER_BREITE = 1000
FENSTER_HÖHE = 700
ZIEL_FPS = 60

# --- Farbdefinitionen (RGB) ---
SCHWARZ = (10, 10, 18)
WEISS = (255, 255, 255)
CYAN = (0, 220, 255)
BLAU = (0, 100, 255)
ORANGE = (255, 140, 0)
GELB = (255, 220, 0)
GRAU = (120, 120, 140)

# Pygame initialisieren
pygame.init()
pygame.font.init()

bildschirm = pygame.display.set_mode((FENSTER_BREITE, FENSTER_HÖHE))
pygame.display.set_caption("Tornado & Vortex Simulation - IT-AG 8. Klasse")
uhr = pygame.time.Clock()

# Schriftart für Textanzeige (Statistik & Modi)
try:
    schrift_gross = pygame.font.SysFont("Arial", 22, bold=True)
    schrift_klein = pygame.font.SysFont("Arial", 16)
except Exception:
    schrift_gross = pygame.font.Font(None, 24)
    schrift_klein = pygame.font.Font(None, 18)


class Partikel(pygame.sprite.Sprite):
    """
    Die Partikelklasse verwaltet einzelne Wirbel- oder Explosions-Teilchen.
    Sie erbt von pygame.sprite.Sprite, um die praktische Sprite-Gruppen-Verwaltung zu nutzen.
    """
    def __init__(self, zentrum_x, zentrum_y, typ="implosion"):
        super().__init__()
        self.typ = typ
        self.zentrum_x = zentrum_x
        self.zentrum_y = zentrum_y

        if self.typ == "implosion":
            # Start in einem gewissen Abstand vom Wirbelzentrum im Ring
            self.radius = random.uniform(80, 320)
            self.winkel = random.uniform(0, 2 * math.pi)
            # Rotationsgeschwindigkeit (Winkelgeschwindigkeit in Rad/s)
            self.rot_geschw = random.uniform(4.0, 7.5)
            # Nach innen gerichtete Einzugsgeschwindigkeit
            self.zug_geschw = random.uniform(90, 160)
            # Vertikale Aufwärtsgeschwindigkeit im Trichter
            self.y_geschw = random.uniform(60, 130)
            # Höhe relativ zum Wirbelzentrum (startet etwas unterhalb oder auf Zentrumshöhe)
            self.hohe_offset = random.uniform(20, 180)
            
            # Farbe und Größe
            self.farbe = random.choice([CYAN, BLAU, WEISS])
            self.grosse = random.randint(2, 5)
            self.alpha = 220
        else:
            # Explosionsmodus: startet direkt am Zentrum
            self.x = zentrum_x
            self.y = zentrum_y
            # Zufällige Flugrichtung im Vollkreis
            winkel = random.uniform(0, 2 * math.pi)
            start_geschw = random.uniform(150, 350)
            self.vx = math.cos(winkel) * start_geschw
            self.vy = math.sin(winkel) * start_geschw
            # Abbremsung (Luftwiderstand)
            self.reibung = 0.96
            
            self.farbe = random.choice([ORANGE, GELB, WEISS])
            self.grosse = random.randint(3, 6)
            self.alpha = 255

        # Visuelle Darstellung als Surface mit Transparenz (Alpha)
        self.image_original = pygame.Surface((self.grosse * 2, self.grosse * 2), pygame.SRCALPHA)
        pygame.draw.circle(self.image_original, self.farbe, (self.grosse, self.grosse), self.grosse)
        self.image = self.image_original.copy()
        self.rect = self.image.get_rect()

    def update(self, dt, ziel_x, ziel_y):
        """
        Aktualisiert die Position und Transparenz des Partikels basierend auf der vergangenen Zeit (dt).
        Delta Time sorgt dafür, dass die Simulation auf allen Computern gleich schnell läuft.
        """
        self.zentrum_x = ziel_x
        self.zentrum_y = ziel_y

        if self.typ == "implosion":
            # Spirale nach innen: Radius verringern
            self.radius -= self.zug_geschw * dt
            # Rotation um das Zentrum erhöhen
            self.winkel += self.rot_geschw * dt
            # Nach oben bewegen (Tornado-Sog nach oben)
            self.hohe_offset -= self.y_geschw * dt

            # Kartesische Koordinaten aus Polarkoordinaten (Radius & Winkel) berechnen
            x = self.zentrum_x + math.cos(self.winkel) * self.radius
            y = self.zentrum_y + math.sin(self.winkel) * self.radius - self.hohe_offset

            self.rect.center = (int(x), int(y))

            # Transparenz anpassen (je näher am Zentrum oder je höher, desto durchsichtiger)
            if self.radius < 40 or self.hohe_offset < -50:
                self.alpha -= 400 * dt

            # Partikel entfernen, wenn es im Zentrum angekommen ist oder den oberen Rand erreicht
            if self.radius <= 15 or self.alpha <= 0 or y < 20:
                self.kill()

        else:
            # Explosionsmodus: Physik mit Geschwindigkeit und Reibung
            self.x += self.vx * dt
            self.y += self.vy * dt
            self.vx *= self.reibung
            self.vy *= self.reibung

            self.rect.center = (int(self.x), int(self.y))

            # Verblassen
            self.alpha -= 120 * dt
            if self.alpha <= 0:
                self.kill()

        # Alpha-Wert für das Bild anwenden (Sanftes Verblassen)
        if self.alpha < 0:
            self.alpha = 0
        if self.alpha > 255:
            self.alpha = 255
        
        self.image = self.image_original.copy()
        self.image.set_alpha(int(self.alpha))


def zeichne_hintergrund_effekte(oberfläche, zentrum_x, zentrum_y, zeit):
    """
    Zeichnet rotierende Energieflusslinien um das Wirbelzentrum,
    um den Sog und die Rotation (Vortex) visuell darzustellen.
    """
    # Sanfter pulsierender Kreis um das Zentrum
    radius_kern = 35 + math.sin(zeit * 4) * 5
    pygame.draw.circle(oberfläche, (0, 80, 160), (int(zentrum_x), int(zentrum_y)), int(radius_kern), 1)
    pygame.draw.circle(oberfläche, CYAN, (int(zentrum_x), int(zentrum_y)), 15, 2)

    # Mehrere spiralförmige Energiebänder
    anzahl_linien = 6
    for i in range(anzahl_linien):
        basis_winkel = zeit * 1.5 + (i * 2 * math.pi / anzahl_linien)
        punkte = []
        for r in range(20, 300, 15):
            w = basis_winkel + (r * 0.01)
            x = zentrum_x + math.cos(w) * r
            y = zentrum_y + math.sin(w) * r * 0.6  # leicht elliptisch für 3D-Trichtereffekt
            punkte.append((x, y))
        if len(punkte) > 1:
            pygame.draw.aalines(oberfläche, (0, 60, 110), False, punkte)


def hauptschleife():
    # Sprite-Gruppe für alle aktiven Partikel
    alle_partikel = pygame.sprite.Group()

    laeuft = True
    maus_x, maus_y = FENSTER_BREITE // 2, FENSTER_HÖHE // 2
    simulation_zeit = 0.0

    # Timer für kontrollierte Partikel-Erzeugungsrate bei gedrückter Maustaste
    erzeugungs_timer = 0.0
    erzeugungs_intervall = 0.015  # Sekunde pro Partikel-Batch

    haeufigkeit_batch = 4  # Anzahl Partikel pro Erzeugungs-Intervall

    aktiver_modus = "RUHEZUSTAND"

    while laeuft:
        # Delta Time (dt) in Sekunden seit dem letzten Frame berechnen
        # Das sorgt dafür, dass die Simulation auf allen Computern gleich schnell bleibt.
        dt = uhr.tick(ZIEL_FPS) / 1000.0
        if dt > 0.1:  # Begrenzung bei Lag-Spitzen
            dt = 0.1

        simulation_zeit += dt

        # --- 1. Event-Verarbeitung ---
        maus_gedrueckt_links = False
        maus_gedrueckt_rechts = False

        for ereignis in pygame.event.get():
            if ereignis.type == pygame.QUIT:
                laeuft = False
            elif ereignis.type == pygame.KEYDOWN:
                if ereignis.key == pygame.K_SPACE:
                    # Leertaste löscht alle Partikel sofort
                    alle_partikel.empty()
                elif ereignis.key == pygame.K_ESCAPE:
                    laeuft = False

        # Aktuelle Mausposition abrufen
        maus_pos = pygame.mouse.get_pos()
        # Wirbelzentrum folgt der Maus sanft mit linearer Interpolation (Lerp) für weiche Bewegungen
        maus_x += (maus_pos[0] - maus_x) * min(1.0, 12.0 * dt)
        maus_y += (maus_pos[1] - maus_y) * min(1.0, 12.0 * dt)

        # Maustasten abfragen
        tasten = pygame.mouse.get_pressed()
        if tasten[0]:  # Linke Maustaste: Implosions-Wirbel
            maus_gedrueckt_links = True
            aktiver_modus = "IMPLOSION / VORTEX"
        elif tasten[2]:  # Rechte Maustaste: Explosion
            maus_gedrueckt_rechts = True
            aktiver_modus = "EXPLOSION"
        else:
            aktiver_modus = "RUHEZUSTAND (BEREIT)"

        # --- 2. Partikel-Erzeugung bei gedrückter Maustaste ---
        if maus_gedrueckt_links or maus_gedrueckt_rechts:
            erzeugungs_timer += dt
            if erzeugungs_timer >= erzeugungs_intervall:
                erzeugungs_timer = 0.0
                typ = "implosion" if maus_gedrueckt_links else "explosion"
                for _ in range(haeufigkeit_batch):
                    # Begrenzung der Gesamtzahl, um Performance stabil zu halten
                    if len(alle_partikel) < 1500:
                        partikel = Partikel(maus_x, maus_y, typ=typ)
                        alle_partikel.add(partikel)

        # --- 3. Update der Simulation ---
        alle_partikel.update(dt, maus_x, maus_y)

        # --- 4. Zeichnen ---
        bildschirm.fill(SCHWARZ)

        # Hintergrund-Energieflusslinien um das Zentrum zeichnen
        zeichne_hintergrund_effekte(bildschirm, maus_x, maus_y, simulation_zeit)

        # Alle Partikel auf den Bildschirm zeichnen
        alle_partikel.draw(bildschirm)

        # --- 5. UI & Statistik-Overlay am oberen Bildschirmrand ---
        # Schwarzer Halbtransparenter Balken oben für gute Lesbarkeit
        ui_hintergrund = pygame.Surface((FENSTER_BREITE, 55), pygame.SRCALPHA)
        ui_hintergrund.fill((20, 20, 30, 200))
        bildschirm.blit(ui_hintergrund, (0, 0))

        # Textinformationen rendern
        fps_wert = int(uhr.get_fps())
        anzahl_teilchen = len(alle_partikel)

        text_modus = schrift_gross.render(f"MODUS: {aktiver_modus}", True, CYAN if "IMPLOSION" in aktiver_modus else (ORANGE if "EXPLOSION" in aktiver_modus else WEISS))
        text_stats = schrift_klein.render(f"Partikel: {anzahl_teilchen} | FPS: {fps_wert}", True, WEISS)
        text_steuerung = schrift_klein.render("Steuerung: [LMT] Implosion  |  [RMT] Explosion  |  [SPACE] Alle löschen", True, GRAU)

        bildschirm.blit(text_modus, (20, 12))
        bildschirm.blit(text_stats, (420, 16))
        bildschirm.blit(text_steuerung, (20, 36))

        # Anzeige aktualisieren
        pygame.display.flip()

    pygame.quit()
    sys.exit()


if __name__ == "__main__":
    hauptschleife()
