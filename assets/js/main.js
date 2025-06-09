const navMenu = document.getElementById('nav_menu');
const navToggle = document.getElementById('nav_toggle');
const navClose = document.getElementById('nav_close');

function initializeNavigation() {
    if (navToggle) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.add('show-menu');
        });
    }

    if (navClose) {
        navClose.addEventListener('click', () => {
            navMenu.classList.remove('show-menu');
        });
    }

    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('show-menu');
        });
    });

    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            if (targetId) {
                showSection(targetId);
                updateActiveNavLink(link);
                
                if (targetId === 'picker' && window.colorPicker) {
                    window.colorPicker.unfreezeForNavigation();
                }
            }
        });
    });
}

function showSection(sectionId) {
    document.querySelectorAll('.picker-section, .matches-section').forEach(section => {
        section.style.display = 'none';
    });
    
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.style.display = 'block';
    } else {
        console.warn(`Section with id '${sectionId}' not found`);
    }
    
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

function updateActiveNavLink(activeLink) {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active-link');
    });
    if (activeLink) {
        activeLink.classList.add('active-link');
    }
}

function initializeStickyHeader() {
    window.addEventListener('scroll', () => {
        const header = document.getElementById('header');
        if (header) {
            if (window.scrollY >= 50) {
                header.classList.add('sticky-header');
            } else {
                header.classList.remove('sticky-header');
            }
        }
    });
}

class ColorPicker {
    constructor() {
        this.imageInput = document.getElementById('imageInput');
        this.canvas = document.getElementById('imageCanvas');
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        this.colorPreview = document.getElementById('colorPreview');
        this.hexValue = document.getElementById('hexValue');
        this.rgbValue = document.getElementById('rgbValue');
        this.hslValue = document.getElementById('hslValue');
        this.coordinates = document.getElementById('coordinates');
        this.pickerContainer = document.getElementById('pickerContainer');
        this.instructions = document.getElementById('instructions');
        this.matchProductsBtn = document.getElementById('matchProductsBtn');
        this.selectedColorDisplay = document.getElementById('selectedColorDisplay');
        this.selectedColorPreview = document.getElementById('selectedColorPreview');
        
        this.currentImage = null;
        this.currentColor = { r: 0, g: 0, b: 0, hex: '#000000', rgb: 'rgb(0, 0, 0)', hsl: 'hsl(0, 0%, 0%)' };
        this.selectedColor = null;
        this.hasDetectedColor = false;
        this.isColorFrozen = false;
        
        this.initialize();
    }
    
    initialize() {
        if (!this.canvas || !this.ctx) {
            console.error('Canvas not found or context unavailable');
            return;
        }
        
        this.bindEvents();
    }
    
    bindEvents() {
        if (this.imageInput) {
            this.imageInput.addEventListener('change', (e) => this.handleImageUpload(e));
        }
        
        if (this.canvas) {
            this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
            this.canvas.addEventListener('mouseleave', () => this.handleMouseLeave());
            this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        }
        
        if (this.colorPreview) {
            this.colorPreview.addEventListener('click', () => this.selectCurrentColor());
        }
        
        if (this.matchProductsBtn) {
            this.matchProductsBtn.addEventListener('click', () => {
                showSection('matches');
                updateActiveNavLink(document.querySelector('a[href="#matches"]'));
                this.displayProductMatches();
            });
        }
        
        [this.hexValue, this.rgbValue, this.hslValue].forEach(element => {
            if (element) {
                element.addEventListener('click', () => this.copyColorValue(element));
            }
        });
    }
    
    async copyColorValue(element) {
        try {
            await navigator.clipboard.writeText(element.textContent);
            const originalText = element.textContent;
            element.textContent = 'Copied!';
            setTimeout(() => {
                element.textContent = originalText;
            }, 1000);
        } catch (err) {
            console.warn('Could not copy to clipboard:', err);
        }
    }
    
    handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.currentImage = img;
                this.drawImageOnCanvas();
                this.showPicker();
                this.reset();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
    
    showPicker() {
        if (this.pickerContainer) {
            this.pickerContainer.style.display = 'flex';
        }
        if (this.instructions) {
            this.instructions.style.display = 'none';
        }
    }
    
    reset() {
        this.isColorFrozen = false;
        this.hasDetectedColor = false;
        this.selectedColor = null;
        this.unfreezeColorValues();
        
        if (this.selectedColorDisplay) {
            this.selectedColorDisplay.classList.remove('show');
        }
        if (this.matchProductsBtn) {
            this.matchProductsBtn.classList.remove('show');
        }
    }
    
    drawImageOnCanvas() {
        if (!this.currentImage || !this.canvas || !this.ctx) return;
        
        const maxWidth = 600;
        const maxHeight = 600;
        let { width, height } = this.currentImage;
        
        if (width > height) {
            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }
        } else {
            if (height > maxHeight) {
                width = (width * maxHeight) / height;
                height = maxHeight;
            }
        }
        
        this.canvas.width = width;
        this.canvas.height = height;
        
        this.ctx.drawImage(this.currentImage, 0, 0, width, height);
        
        this.canvas.style.cursor = 'crosshair';
        this.canvas.title = 'Click on any part of the image to select that color';
    }
    
    handleCanvasClick(event) {
        if (!this.currentImage || !this.canvas) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = Math.floor((event.clientX - rect.left) * (this.canvas.width / rect.width));
        const y = Math.floor((event.clientY - rect.top) * (this.canvas.height / rect.height));
        
        const imageData = this.ctx.getImageData(x, y, 1, 1);
        const [r, g, b] = imageData.data;
        
        this.currentColor = {
            r, g, b,
            hex: this.rgbToHex(r, g, b),
            rgb: `rgb(${r}, ${g}, ${b})`,
            hsl: this.rgbToHsl(r, g, b)
        };
        
        this.hasDetectedColor = true;
        this.updateColorDisplay();
        this.freezeColorValues();
        
        if (this.coordinates) {
            this.coordinates.textContent = `Position: (${x}, ${y}) - Color Selected`;
        }
        
        this.selectCurrentColor();
        this.addClickFeedback(event.clientX - rect.left, event.clientY - rect.top);
    }
    
    handleMouseMove(event) {
        if (!this.currentImage || !this.canvas || this.isColorFrozen) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = Math.floor((event.clientX - rect.left) * (this.canvas.width / rect.width));
        const y = Math.floor((event.clientY - rect.top) * (this.canvas.height / rect.height));
        
        if (x < 0 || y < 0 || x >= this.canvas.width || y >= this.canvas.height) return;
        
        const imageData = this.ctx.getImageData(x, y, 1, 1);
        const [r, g, b] = imageData.data;
        
        this.currentColor = {
            r, g, b,
            hex: this.rgbToHex(r, g, b),
            rgb: `rgb(${r}, ${g}, ${b})`,
            hsl: this.rgbToHsl(r, g, b)
        };
        
        this.updateColorPreview();
        this.updateColorValues();
        
        if (this.coordinates) {
            this.coordinates.textContent = `Position: (${x}, ${y})`;
        }
        
        this.hasDetectedColor = true;
    }
    
    handleMouseLeave() {
        if (this.coordinates) {
            this.coordinates.textContent = 'Position: (0, 0)';
        }
    }
    
    updateColorDisplay() {
        this.updateColorPreview();
        this.updateColorValues();
    }
    
    updateColorPreview() {
        if (this.colorPreview) {
            this.colorPreview.style.backgroundColor = this.currentColor.hex;
        }
    }
    
    updateColorValues() {
        if (this.hexValue) this.hexValue.textContent = this.currentColor.hex;
        if (this.rgbValue) this.rgbValue.textContent = this.currentColor.rgb;
        if (this.hslValue) this.hslValue.textContent = this.currentColor.hsl;
    }
    
    freezeColorValues() {
        this.isColorFrozen = true;
        [this.hexValue, this.rgbValue, this.hslValue].forEach(element => {
            if (element) {
                element.style.fontWeight = 'bold';
                element.style.border = '2px solid #fe2890';
                element.style.borderRadius = '4px';
                element.style.padding = '2px 4px';
            }
        });
    }
    
    unfreezeColorValues() {
        this.isColorFrozen = false;
        [this.hexValue, this.rgbValue, this.hslValue].forEach(element => {
            if (element) {
                element.style.fontWeight = '';
                element.style.border = '';
                element.style.borderRadius = '';
                element.style.padding = '';
            }
        });
    }
    
    unfreezeForNavigation() {
        this.unfreezeColorValues();
        if (this.currentImage && this.hasDetectedColor) {
            this.updateColorDisplay();
        }
    }
    
    selectCurrentColor() {
        if (!this.hasDetectedColor) return;
        
        this.selectedColor = { ...this.currentColor };
        
        if (this.selectedColorDisplay) {
            this.selectedColorDisplay.classList.add('show');
        }
        
        if (this.selectedColorPreview) {
            this.selectedColorPreview.style.backgroundColor = this.selectedColor.hex;
        }
        
        if (this.colorPreview) {
            this.colorPreview.classList.add('selected');
            setTimeout(() => {
                this.colorPreview.classList.remove('selected');
            }, 1000);
        }
        
        if (this.matchProductsBtn) {
            this.matchProductsBtn.classList.add('show');
        }
    }
    
    addClickFeedback(x, y) {
        const canvasContainer = document.querySelector('.canvas-container');
        if (!canvasContainer) return;
        
        canvasContainer.style.position = 'relative';
        
        const feedback = document.createElement('div');
        feedback.style.cssText = `
            position: absolute;
            left: ${x}px;
            top: ${y}px;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            border: 2px solid rgba(254, 40, 144, 0.8);
            background-color: rgba(254, 40, 144, 0.3);
            transform: translate(-50%, -50%) scale(0);
            pointer-events: none;
            z-index: 1000;
            box-shadow: 0 0 20px rgba(254, 40, 144, 0.4);
        `;
        
        canvasContainer.appendChild(feedback);
        
        requestAnimationFrame(() => {
            feedback.style.transition = 'all 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            feedback.style.transform = 'translate(-50%, -50%) scale(1)';
            feedback.style.opacity = '1';
            
            setTimeout(() => {
                feedback.style.transition = 'all 0.5s ease-out';
                feedback.style.opacity = '0';
                feedback.style.transform = 'translate(-50%, -50%) scale(1.5)';
            }, 400);
        });
        
        setTimeout(() => {
            if (feedback.parentNode) {
                feedback.parentNode.removeChild(feedback);
            }
        }, 1200);
    }
    
    displayProductMatches() {
        if (!this.selectedColor) {
            console.log('No selected color available for matching');
            return;
        }
        
        // Check if product database is loaded
        if (!productDatabase || productDatabase.length === 0) {
            console.error('Product database not loaded yet');
            // You could show a loading message or retry loading here
            return;
        }
        
        console.log('Finding matches for color:', this.selectedColor);
        
        const matchesColorCircle = document.getElementById('matchesColorCircle');
        const matchesColorText = document.getElementById('matchesColorText');
        const productGrid = document.getElementById('productGrid');
        
        if (matchesColorCircle) {
            matchesColorCircle.style.backgroundColor = this.selectedColor.hex;
        }
        if (matchesColorText) {
            matchesColorText.textContent = this.selectedColor.hex;
        }
        
        const matches = this.findColorMatches(this.selectedColor);
        console.log(`Found ${matches.length} matches`);
        
        if (productGrid) {
            productGrid.innerHTML = '';
            
            if (matches.length === 0) {
                this.displayNoMatches(productGrid);
            } else {
                matches.forEach(match => {
                    const productCard = this.createProductCard(match);
                    productGrid.appendChild(productCard);
                });
            }
        } else {
            console.error('Product grid element not found');
        }
    }
    
    displayNoMatches(container) {
        const noMatchesMessage = document.createElement('div');
        noMatchesMessage.className = 'no-matches-message';
        noMatchesMessage.style.cssText = `
            text-align: center;
            padding: 40px 20px;
            color: #666;
            font-size: 18px;
            grid-column: 1 / -1;
        `;
        noMatchesMessage.innerHTML = `
            <div style="font-size: 48px; margin-bottom: 16px;">🎨</div>
            <h3 style="margin-bottom: 8px; color: #333;">No matches found</h3>
            <p>We couldn't find any makeup products that closely match your selected color.</p>
            <p style="margin-top: 12px; font-size: 14px;">Try selecting a different color from your image to find matching products.</p>
        `;
        container.appendChild(noMatchesMessage);
    }
    
    findColorMatches(targetColor) {
        const matches = productDatabase.map(product => {
            const productRgb = this.hexToRgb(product.hex);
            if (!productRgb) {
                console.error('Invalid hex color:', product.hex);
                return null;
            }
            
            const distance = this.calculateColorDistance(targetColor, productRgb);
            const maxDistance = Math.sqrt(255 * 255 + 255 * 255 + 255 * 255);
            const matchPercentage = Math.max(0, 100 - (distance / maxDistance) * 100);
            
            return {
                ...product,
                distance,
                matchPercentage: Math.round(matchPercentage * 10) / 10
            };
        }).filter(match => match !== null);
        
        const sortedMatches = matches.sort((a, b) => b.matchPercentage - a.matchPercentage);
        
        const threshold = sortedMatches.length > 8 ? 25 : 15;
        return sortedMatches.filter(match => match.matchPercentage >= threshold).slice(0, 12);
    }
    
    calculateColorDistance(color1, color2) {
        const rDiff = color1.r - color2.r;
        const gDiff = color1.g - color2.g;
        const bDiff = color1.b - color2.b;
        
        return Math.sqrt(2 * rDiff * rDiff + 4 * gDiff * gDiff + 3 * bDiff * bDiff);
    }
    
    createProductCard(product) {
        const card = document.createElement('div');
        card.className = 'product-card';
        
        card.innerHTML = `
            <div class="product-color" style="background-color: ${product.hex}"></div>
            <div class="product-brand">${product.brand}</div>
            <div class="product-name">${product.name}</div>
            <div class="product-shade">${product.shade} • ${product.type}</div>
            <div class="product-match">${product.matchPercentage}% Match</div>
        `;
        
        return card;
    }
    
    rgbToHex(r, g, b) {
        return "#" + [r, g, b].map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? "0" + hex : hex;
        }).join("");
    }
    
    rgbToHsl(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;
        
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
        
        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        
        return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
    }
    
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }
}

const productDatabase = [
    { brand: "Charlotte Tilbury", name: "Matte Revolution Lipstick", shade: "Pillow Talk", type: "Lipstick", hex: "#c8857d" },
    { brand: "Charlotte Tilbury", name: "Matte Revolution Lipstick", shade: "Red Carpet Red", type: "Lipstick", hex: "#dc143c" },
    { brand: "Charlotte Tilbury", name: "Matte Revolution Lipstick", shade: "Very Victoria", type: "Lipstick", hex: "#8b0000" },
    { brand: "Fenty Beauty", name: "Stunna Lip Paint", shade: "Uncensored", type: "Lipstick", hex: "#b22222" },
    { brand: "Fenty Beauty", name: "Stunna Lip Paint", shade: "Unveil", type: "Lipstick", hex: "#cd5c5c" },
    { brand: "MAC", name: "Lipstick", shade: "Ruby Woo", type: "Lipstick", hex: "#dc143c" },
    { brand: "MAC", name: "Lipstick", shade: "Velvet Teddy", type: "Lipstick", hex: "#a0522d" },
    { brand: "MAC", name: "Lipstick", shade: "Honeylove", type: "Lipstick", hex: "#daa520" },
    { brand: "Rare Beauty", name: "Soft Pinch Liquid Blush", shade: "Bliss", type: "Lipstick", hex: "#ff69b4" },
    { brand: "Rare Beauty", name: "Soft Pinch Liquid Blush", shade: "Believe", type: "Blush", hex: "#ff1493" },
    { brand: "Rare Beauty", name: "Soft Pinch Liquid Blush", shade: "Encourage", type: "Blush", hex: "#fa8072" },
    { brand: "Rare Beauty", name: "Soft Pinch Liquid Blush", shade: "Hope", type: "Blush", hex: "#ffc0cb" },
    { brand: "NARS", name: "Blush", shade: "Orgasm", type: "Blush", hex: "#ff69b4" },
    { brand: "NARS", name: "Blush", shade: "Deep Throat", type: "Blush", hex: "#cd5c5c" },
    { brand: "Milani", name: "Baked Blush", shade: "Luminoso", type: "Blush", hex: "#ff7f50" },
    { brand: "Tarte", name: "Amazonian Clay Blush", shade: "Paaarty", type: "Blush", hex: "#ff69b4" },
    { brand: "Urban Decay", name: "Vice Lipstick", shade: "1993", type: "Lipstick", hex: "#8b4513" },
    { brand: "Too Faced", name: "Melted Matte", shade: "Queen B", type: "Lipstick", hex: "#800080" },
    { brand: "Glossier", name: "Cloud Paint", shade: "Beam", type: "Blush", hex: "#ff6347" },
    { brand: "Glossier", name: "Cloud Paint", shade: "Puff", type: "Blush", hex: "#ff91a4" },
    { brand: "Dior", name: "Rouge Dior Lipstick", shade: "999", type: "Lipstick", hex: "#d1001c" },
    { brand: "Dior", name: "Addict Lip Glow", shade: "Pink", type: "Lipstick", hex: "#f4a2ab" },
    { brand: "Maybelline", name: "SuperStay Matte Ink", shade: "Pioneer", type: "Lipstick", hex: "#b31b1b" },
    { brand: "Maybelline", name: "SuperStay Matte Ink", shade: "Lover", type: "Lipstick", hex: "#b76e79" },
    { brand: "YSL", name: "Rouge Pur Couture", shade: "Le Rouge", type: "Lipstick", hex: "#c1121f" },
    { brand: "YSL", name: "Tatouage Couture Matte Lip Stain", shade: "Rose Illicit", type: "Lipstick", hex: "#ce5a57" },
    { brand: "Pat McGrath", name: "MatteTrance Lipstick", shade: "Flesh 3", type: "Lipstick", hex: "#8b3e2f" },
    { brand: "Pat McGrath", name: "MatteTrance Lipstick", shade: "Elson", type: "Lipstick", hex: "#b00020" },
    { brand: "Huda Beauty", name: "Power Bullet Matte", shade: "Interview", type: "Lipstick", hex: "#a9716b" },
    { brand: "Huda Beauty", name: "Power Bullet Matte", shade: "Prom Night", type: "Lipstick", hex: "#d36c92" },
    { brand: "Benefit", name: "Benetint", shade: "Rose", type: "Blush", hex: "#de3163" },
    { brand: "Benefit", name: "Dandelion", shade: "Brightening Blush", type: "Blush", hex: "#f7cac9" },
    { brand: "Clinique", name: "Cheek Pop", shade: "Ginger Pop", type: "Blush", hex: "#e97451" },
    { brand: "Tower 28", name: "BeachPlease Lip + Cheek Cream Blush", shade: "Happy Hour", type: "Blush", hex: "#ff6b6b" },
    { brand: "Kylie Cosmetics", name: "Matte Lip Kit", shade: "Candy K", type: "Lipstick", hex: "#b76e79" },
    { brand: "Charlotte Tilbury", name: "Matte Revolution Lipstick", shade: "Walk of No Shame", type: "Lipstick", hex: "#a23a3a" },
    { brand: "Charlotte Tilbury", name: "Matte Revolution Lipstick", shade: "Bond Girl", type: "Lipstick", hex: "#9e4b40" },
    { brand: "Fenty Beauty", name: "Stunna Lip Paint", shade: "Unattached", type: "Lipstick", hex: "#ff4d4d" },
    { brand: "Fenty Beauty", name: "Stunna Lip Paint", shade: "Underdawg", type: "Lipstick", hex: "#4b1e24" },
    { brand: "MAC", name: "Lipstick", shade: "Whirl", type: "Lipstick", hex: "#8b5c4a" },
    { brand: "MAC", name: "Lipstick", shade: "Chili", type: "Lipstick", hex: "#b4472c" },
    { brand: "Rare Beauty", name: "Soft Pinch Liquid Blush", shade: "Joy", type: "Blush", hex: "#f8a07d" },
    { brand: "Rare Beauty", name: "Soft Pinch Liquid Blush", shade: "Grace", type: "Blush", hex: "#f469a9" },
    { brand: "NARS", name: "Blush", shade: "Torrid", type: "Blush", hex: "#ff6666" },
    { brand: "NARS", name: "Blush", shade: "Amour", type: "Blush", hex: "#d75c6d" },
    { brand: "Milani", name: "Baked Blush", shade: "Dolce Pink", type: "Blush", hex: "#f47ca2" },
    { brand: "Tarte", name: "Amazonian Clay Blush", shade: "Exposed", type: "Blush", hex: "#dcaea1" },
    { brand: "Urban Decay", name: "Vice Lipstick", shade: "Backtalk", type: "Lipstick", hex: "#c1839f" },
    { brand: "Too Faced", name: "Melted Matte", shade: "Sell Out", type: "Lipstick", hex: "#b26b6b" },
    { brand: "Glossier", name: "Cloud Paint", shade: "Dusk", type: "Blush", hex: "#c89a88" },
    { brand: "Glossier", name: "Cloud Paint", shade: "Haze", type: "Blush", hex: "#a84a6a" },
    { brand: "Dior", name: "Addict Lip Glow", shade: "Coral", type: "Lipstick", hex: "#fa8072" },
    { brand: "Dior", name: "Rouge Dior Lipstick", shade: "Classic Matte", type: "Lipstick", hex: "#a52a2a" },
    { brand: "Maybelline", name: "SuperStay Matte Ink", shade: "Ruler", type: "Lipstick", hex: "#b94c68" },
    { brand: "Maybelline", name: "SuperStay Matte Ink", shade: "Seductress", type: "Lipstick", hex: "#a86f6f" },
    { brand: "YSL", name: "Tatouage Couture Matte Lip Stain", shade: "Nude Emblem", type: "Lipstick", hex: "#c3706d" },
    { brand: "YSL", name: "Rouge Pur Couture", shade: "Rose Stiletto", type: "Lipstick", hex: "#c94b74" },
    { brand: "Pat McGrath", name: "MatteTrance Lipstick", shade: "Beautiful Stranger", type: "Lipstick", hex: "#ba7e79" },
    { brand: "Pat McGrath", name: "MatteTrance Lipstick", shade: "1995", type: "Lipstick", hex: "#8c5a4e" },
    { brand: "Huda Beauty", name: "Power Bullet Matte", shade: "Wedding Day", type: "Lipstick", hex: "#a9736b" },
    { brand: "Huda Beauty", name: "Power Bullet Matte", shade: "Third Date", type: "Lipstick", hex: "#e26d7f" },
    { brand: "Benefit", name: "Benetint", shade: "Love Tint", type: "Blush", hex: "#dc143c" },
    { brand: "Clinique", name: "Cheek Pop", shade: "Fig Pop", type: "Blush", hex: "#a0525c" },
    { brand: "Tower 28", name: "BeachPlease Lip + Cheek Cream Blush", shade: "Golden Hour", type: "Blush", hex: "#ff9966" },
    { brand: "Tower 28", name: "BeachPlease Lip + Cheek Cream Blush", shade: "Power Hour", type: "Blush", hex: "#a7534f" },
    { brand: "Kylie Cosmetics", name: "Matte Lip Kit", shade: "Kristen", type: "Lipstick", hex: "#dc6c6c" },
    { brand: "Kylie Cosmetics", name: "Matte Lip Kit", shade: "Twenty", type: "Lipstick", hex: "#9c6566" }
];

document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing color picker application...');
    
    initializeNavigation();
    initializeStickyHeader();
    window.colorPicker = new ColorPicker();
    showSection('picker');
    
    console.log('Color picker application initialized successfully');
});