import pygame
import math
import random

# 1. Initialisierung & Fenster-Setup
pygame.init()
WIDTH, HEIGHT = 1000, 700
screen = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("IT-AG: Vortex & Implosion vs. Explosion")
clock = pygame.time.Clock()
font = pygame.font.SysFont("Arial", 18, bold=True)

# 2. Partikel-Klasse für Wirbel & Explosion
class Particle(pygame.sprite.Sprite):
    def __init__(self, center_x, center_y, mode="IMPLOSION", group=None):
        super().__init__(group)
        self.center_x = center_x
        self.center_y = center_y
        self.mode = mode
        
        # Startpositionen & Geometrie
        self.angle = random.uniform(0, math.pi * 2)
        
        if self.mode == "IMPLOSION":
            # Implosion: Partikel starten außen und werden nach INNEN gesaugt
            self.radius = random.uniform(150, 280)
            self.height_y = center_y + random.uniform(120, 220)
            self.rot_speed = random.uniform(0.06, 0.12)
            self.up_speed = random.uniform(1.8, 3.5)
            self.color = (random.randint(100, 255), random.randint(200, 255), 255)
        else:
            # Explosion: Partikel starten im Zentrum und fliegen nach AUSSEN
            self.radius = random.uniform(5, 20)
            self.height_y = center_y + random.uniform(-20, 20)
            self.rot_speed = random.uniform(-0.05, 0.05)
            self.up_speed = random.uniform(-2.0, 2.0)
            self.exp_speed_x = math.cos(self.angle) * random.uniform(3, 8)
            self.exp_speed_y = math.sin(self.angle) * random.uniform(3, 8)
            self.color = (255, random.randint(100, 200), random.randint(0, 50))
            
        self.size = random.randint(3, 7)
        self.alpha = 255
        self.image = pygame.Surface((self.size * 2, self.size * 2), pygame.SRCALPHA)
        self.rect = self.image.get_rect()
        self.update_position()

    def update_position(self):
        if self.mode == "IMPLOSION":
            x = self.center_x + math.cos(self.angle) * self.radius
            y = self.height_y
        else:
            x = self.rect.centerx + self.exp_speed_x
            y = self.rect.centery + self.exp_speed_y
        self.rect.center = (int(x), int(y))

    def update(self):
        if self.mode == "IMPLOSION":
            self.angle += self.rot_speed
            self.height_y -= self.up_speed
            self.radius *= 0.992  # Sog-Effekt nach innen
            self.alpha -= 2.2
        else:
            self.rect.x += int(self.exp_speed_x)
            self.rect.y += int(self.exp_speed_y)
            self.alpha -= 3.5

        if self.alpha <= 0 or self.radius < 2:
            self.kill()
            return

        self.image.fill((0, 0, 0, 0))
        pygame.draw.circle(self.image, (*self.color, int(max(0, self.alpha))), (self.size, self.size), self.size)
        
        if self.mode == "IMPLOSION":
            self.update_position()

# 3. Hauptschleife
particle_group = pygame.sprite.Group()
current_mode = "IMPLOSION"
running = True

while running:
    dt = clock.tick(60)
    
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
        elif event.type == pygame.KEYDOWN:
            if event.key == pygame.K_SPACE:
                # Umschalten zwischen Implosion & Explosion
                current_mode = "EXPLOSION" if current_mode == "IMPLOSION" else "IMPLOSION"
            elif event.key == pygame.K_c:
                particle_group.empty()

    mouse_x, mouse_y = pygame.mouse.get_pos()
    
    # Partikel erzeugen
    spawn_rate = 8 if current_mode == "IMPLOSION" else 15
    for _ in range(spawn_rate):
        Particle(mouse_x, mouse_y, mode=current_mode, group=particle_group)

    particle_group.update()

    # Rendering
    screen.fill((10, 12, 20))
    
    # Zentrums-Markierung
    pygame.draw.circle(screen, (0, 255, 200) if current_mode == "IMPLOSION" else (255, 100, 0), (mouse_x, mouse_y), 6)
    
    particle_group.draw(screen)

    # UI Dashboard
    mode_text = font.render(f"MODUS: {current_mode} (Taste LEERTASTE zum Wechseln)", True, (255, 255, 255))
    info_text = font.render(f"Partikel im Speicher: {len(particle_group)} | FPS: {int(clock.get_fps())}", True, (180, 180, 180))
    hint_text = font.render("Maus bewegen = Wirbelzentrum verschieben | 'C' = Bildschirm leeren", True, (140, 140, 140))
    
    screen.blit(mode_text, (20, 20))
    screen.blit(info_text, (20, 48))
    screen.blit(hint_text, (20, 76))

    pygame.display.flip()

pygame.quit()
