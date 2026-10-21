import math
import random
try:
    import pygame
except ImportError:
    print("Fehler: Pygame ist nicht installiert.")
    print("Bitte installieren Sie Pygame mit: pip install pygame")
    import sys
    sys.exit(1)

# 1. Pygame initialisieren & Fenster aufsetzen [4, 10]
pygame.init()
WIDTH, HEIGHT = 800, 600
screen = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("IT-AG: 2D-Tornado Particle System")
clock = pygame.time.Clock() # [4]

# 2. Die Partikel-Klasse erbt von pygame.sprite.Sprite [1]
class TornadoParticle(pygame.sprite.Sprite):
    def __init__(self, center_x, center_y, group):
        super().__init__(group) # [1]
        
        # Start-Geometrie des Wirbels
        self.center_x = center_x
        self.center_y = center_y
        
        # Partikel startet unten mit größerem Radius oder im Sogbereich
        self.angle = random.uniform(0, math.pi * 2)
        self.radius = random.uniform(20, 150)
        self.height_y = center_y + random.uniform(100, 200) # Starttiefe
        
        # Geschwindigkeiten
        self.rot_speed = random.uniform(0.05, 0.12)
        self.up_speed = random.uniform(1.5, 3.5)
        
        # Grafik & Alpha (Transparenz) [1, 6]
        self.size = random.randint(3, 7)
        self.image = pygame.Surface((self.size * 2, self.size * 2), pygame.SRCALPHA)
        self.color = (random.randint(150, 255), random.randint(200, 255), 255)
        self.alpha = 255
        
        # Kreis zeichnen [7]
        pygame.draw.circle(self.image, (*self.color, self.alpha), (self.size, self.size), self.size)
        self.rect = self.image.get_rect()
        self.update_position()

    def update_position(self):
        # Trichter-Mathematik: Je höher das Partikel steigt, desto breiter/schmaler wird die Rotation
        x = self.center_x + math.cos(self.angle) * self.radius
        y = self.height_y
        self.rect.center = (int(x), int(y))

    def update(self):
        # 1. Rotation und Steigbewegung
        self.angle += self.rot_speed
        self.height_y -= self.up_speed
        
        # Implosions-Sog: Radius verengt sich leicht nach oben hin
        self.radius *= 0.995 
        
        # 2. Transparenz abbauen (Fading) [6]
        self.alpha -= 2.5
        if self.alpha <= 0:
            self.kill() # Speicher freigeben! [6, 9]
            return
            
        # Bild-Surface neu mit reduzierter Alpha zeichnen [6]
        self.image.fill((0, 0, 0, 0))
        pygame.draw.circle(self.image, (*self.color, int(self.alpha)), (self.size, self.size), self.size)
        self.update_position()

# 3. Hauptschleife (Main Loop) [4]
particle_group = pygame.sprite.Group() # [1, 7]
running = True

while running:
    # Delta Time / FPS auf 60 begrenzen [3-5]
    dt = clock.tick(60) 
    
    # Event Handling [4]
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False

    # Mausposition als Wirbelzentrum nutzen
    mouse_x, mouse_y = pygame.mouse.get_pos()
    
    # In jedem Frame neue Partikel im Zentrum erzeugen
    for _ in range(5):
        TornadoParticle(mouse_x, mouse_y, particle_group)

    # Logik-Update & Rendering [3, 4, 8]
    particle_group.update() # Rufen automatisch die update()-Methode aller Partikel auf [8]
    
    screen.fill((15, 15, 25)) # Dunkler Hintergrund [4]
    particle_group.draw(screen) # Zeichnet alle Sprites der Gruppe [3, 8]
    
    pygame.display.flip() # [4]

pygame.quit()
