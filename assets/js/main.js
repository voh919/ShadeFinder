// Navigation functionality
const navMenu = document.getElementById('nav_menu');
const navToggle = document.getElementById('nav_toggle');
const navClose = document.getElementById('nav_close');

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

document.querySelectorAll('.nav-link').forEach(n => n.addEventListener('click', () => {
    navMenu.classList.remove('show-menu');
}));

document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href').substring(1);
        showSection(targetId);
        updateActiveNavLink(link);
    });
});

function showSection(sectionId) {
    document.querySelectorAll('.picker-section, .matches-section').forEach(section => {
        section.style.display = 'none';
    });
    document.getElementById(sectionId).style.display = 'block';
}

function updateActiveNavLink(activeLink) {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active-link');
    });
    activeLink.classList.add('active-link');
}

window.addEventListener('scroll', () => {
    const header = document.getElementById('header');
    if (window.scrollY >= 50) {
        header.classList.add('sticky-header');
    } else {
        header.classList.remove('sticky-header');
    }
});

// all color picker stuff:
const imageInput = document.getElementById('imageInput');
const canvas = document.getElementById('imageCanvas');
const ctx = canvas.getContext('2d');
const colorPreview = document.getElementById('colorPreview');
const hexValue = document.getElementById('hexValue');
const rgbValue = document.getElementById('rgbValue');
const hslValue = document.getElementById('hslValue');
const coordinates = document.getElementById('coordinates');
const pickerContainer = document.getElementById('pickerContainer');
const instructions = document.getElementById('instructions');
const matchProductsBtn = document.getElementById('matchProductsBtn');
const selectedColorDisplay = document.getElementById('selectedColorDisplay');
const selectedColorPreview = document.getElementById('selectedColorPreview');
const selectedColorText = document.getElementById('selectedColorText');

let currentImage = null;
let currentColor = { r: 0, g: 0, b: 0, hex: '#000000', rgb: 'rgb(0, 0, 0)', hsl: 'hsl(0, 0%, 0%)' };
let selectedColor = null;
let hasDetectedColor = false;
let isColorFrozen = false;

imageInput.addEventListener('change', handleImageUpload);
canvas.addEventListener('mousemove', handleMouseMove);
canvas.addEventListener('mouseleave', handleMouseLeave);
canvas.addEventListener('click', handleCanvasClick);
colorPreview.addEventListener('click', selectCurrentColor);
matchProductsBtn.addEventListener('click', () => {
    showSection('matches');
    updateActiveNavLink(document.querySelector('a[href="#matches"]'));
    displayProductMatches();
});

[hexValue, rgbValue, hslValue].forEach(element => {
    element.addEventListener('click', () => {
        navigator.clipboard.writeText(element.textContent).then(() => {
            const originalText = element.textContent;
            element.textContent = 'Copied!';
            setTimeout(() => {
                element.textContent = originalText;
            }, 1000);
        });
    });
});

function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            currentImage = img;
            drawImageOnCanvas();
            pickerContainer.style.display = 'flex';
            instructions.style.display = 'none';
            isColorFrozen = false;
            unfreezeColorValues(); 
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function drawImageOnCanvas() {
    if (!currentImage) return;
    
    const maxWidth = 600;
    const maxHeight = 600;
    let { width, height } = currentImage;
    
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
    
    canvas.width = width;
    canvas.height = height;
    
    ctx.drawImage(currentImage, 0, 0, width, height);

    hasDetectedColor = false;
    selectedColorDisplay.classList.remove('show');
    matchProductsBtn.classList.remove('show');
    isColorFrozen = false;
    unfreezeColorValues(); 

    canvas.style.cursor = 'crosshair';
    canvas.title = 'Click on any part of the image to select that color';
}

function handleCanvasClick(event) {
    if (!currentImage) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) * (canvas.width / rect.width));
    const y = Math.floor((event.clientY - rect.top) * (canvas.height / rect.height));
    
    const imageData = ctx.getImageData(x, y, 1, 1);
    const [r, g, b] = imageData.data;
    
    currentColor = {
        r, g, b,
        hex: rgbToHex(r, g, b),
        rgb: `rgb(${r}, ${g}, ${b})`,
        hsl: rgbToHsl(r, g, b)
    };
    
    hasDetectedColor = true;
    
    updateColorDisplay();
    freezeColorValues();
    coordinates.textContent = `Position: (${x}, ${y}) - Color Selected`;

    selectCurrentColor();

    const canvasRect = canvas.getBoundingClientRect();
    const clickX = event.clientX - canvasRect.left;
    const clickY = event.clientY - canvasRect.top;
    addClickFeedback(clickX, clickY);
}

function handleMouseMove(event) {
    if (!currentImage) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) * (canvas.width / rect.width));
    const y = Math.floor((event.clientY - rect.top) * (canvas.height / rect.height));
    
    const imageData = ctx.getImageData(x, y, 1, 1);
    const [r, g, b] = imageData.data;
    
    currentColor = {
        r, g, b,
        hex: rgbToHex(r, g, b),
        rgb: `rgb(${r}, ${g}, ${b})`,
        hsl: rgbToHsl(r, g, b)
    };
    
    updateColorPreview();
    if (!isColorFrozen) {
        updateColorValues();
    }
    coordinates.textContent = `Position: (${x}, ${y})`;
    
    hasDetectedColor = true;
}

function handleMouseLeave() {
    coordinates.textContent = 'Position: (0, 0)';
}

function updateColorDisplay() {
    updateColorPreview();
    updateColorValues();
}

function updateColorPreview() {
    colorPreview.style.backgroundColor = currentColor.hex;
}

function updateColorValues() {
    hexValue.textContent = currentColor.hex;
    rgbValue.textContent = currentColor.rgb;
    hslValue.textContent = currentColor.hsl;
}

function freezeColorValues() {
    isColorFrozen = true;
    [hexValue, rgbValue, hslValue].forEach(element => {
        element.style.fontWeight = 'bold';
        element.style.border = '2px solid var(--vshojo-pink, #fe2890)';
        element.style.borderRadius = '4px';
        element.style.padding = '2px 4px';
    });
}

function unfreezeColorValues() {
    isColorFrozen = false;
    [hexValue, rgbValue, hslValue].forEach(element => {
        element.style.fontWeight = '';
        element.style.border = '';
        element.style.borderRadius = '';
        element.style.padding = '';
    });
}

function selectCurrentColor() {
    if (!hasDetectedColor) return;
    
    selectedColor = { ...currentColor };

    selectedColorDisplay.classList.add('show');
    selectedColorPreview.style.backgroundColor = selectedColor.hex;

    colorPreview.classList.add('selected');

    matchProductsBtn.classList.add('show');
    
    setTimeout(() => {
        colorPreview.classList.remove('selected');
    }, 1000);
}

function addClickFeedback(x, y) {
    const canvasContainer = document.querySelector('.canvas-container');
    canvasContainer.style.position = 'relative';
    
    const outerRing = document.createElement('div');
    outerRing.style.cssText = `
        position: absolute;
        left: ${x}px;
        top: ${y}px;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        border: 2px solid hsla(341, 60.60%, 75.10%, 0.96);
        background-color: hsla(340, 65.20%, 82.00%, 0.47);
        transform: translate(-50%, -50%) scale(0);
        pointer-events: none;
        z-index: 1002;
        box-shadow: 0 0 20px hsla(300, 24.60%, 88.00%, 0.67);
    `;
    
    canvasContainer.appendChild(outerRing);
    
    requestAnimationFrame(() => {
        outerRing.style.transition = 'all 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        outerRing.style.transform = 'translate(-50%, -50%) scale(1)';
        outerRing.style.opacity = '1';
        
        setTimeout(() => {
            outerRing.style.transition = 'all 0.5s ease-out';
            outerRing.style.opacity = '0';
            outerRing.style.transform = 'translate(-50%, -50%) scale(1.5)';
        }, 400);
    });
    
    setTimeout(() => {
        [outerRing].forEach(element => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
        });
    }, 1200);
}

function rgbToHex(r, g, b) {
    return "#" + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
    }).join("");
}

function rgbToHsl(r, g, b) {
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

const productDatabase = [
    
    // Lipstick
    { brand: "Charlotte Tilbury", name: "Matte Revolution Lipstick", shade: "Pillow Talk", type: "Lipstick", hex: "#c8857d" },
    { brand: "Charlotte Tilbury", name: "Matte Revolution Lipstick", shade: "Red Carpet Red", type: "Lipstick", hex: "#dc143c" },
    { brand: "Charlotte Tilbury", name: "Matte Revolution Lipstick", shade: "Very Victoria", type: "Lipstick", hex: "#8b0000" },
    { brand: "Fenty Beauty", name: "Stunna Lip Paint", shade: "Uncensored", type: "Lipstick", hex: "#b22222" },
    { brand: "Fenty Beauty", name: "Stunna Lip Paint", shade: "Unveil", type: "Lipstick", hex: "#cd5c5c" },
    { brand: "MAC", name: "Lipstick", shade: "Ruby Woo", type: "Lipstick", hex: "#dc143c" },
    { brand: "MAC", name: "Lipstick", shade: "Velvet Teddy", type: "Lipstick", hex: "#a0522d" },
    { brand: "MAC", name: "Lipstick", shade: "Honeylove", type: "Lipstick", hex: "#daa520" },
    { brand: "Rare Beauty", name: "Soft Pinch Liquid Blush", shade: "Bliss", type: "Lipstick", hex: "#ff69b4" },
    
    // Blushes
    { brand: "Rare Beauty", name: "Soft Pinch Liquid Blush", shade: "Believe", type: "Blush", hex: "#ff1493" },
    { brand: "Rare Beauty", name: "Soft Pinch Liquid Blush", shade: "Encourage", type: "Blush", hex: "#fa8072" },
    { brand: "Rare Beauty", name: "Soft Pinch Liquid Blush", shade: "Hope", type: "Blush", hex: "#ffc0cb" },
    { brand: "NARS", name: "Blush", shade: "Orgasm", type: "Blush", hex: "#ff69b4" },
    { brand: "NARS", name: "Blush", shade: "Deep Throat", type: "Blush", hex: "#cd5c5c" },
    { brand: "Milani", name: "Baked Blush", shade: "Luminoso", type: "Blush", hex: "#ff7f50" },
    { brand: "Tarte", name: "Amazonian Clay Blush", shade: "Paaarty", type: "Blush", hex: "#ff69b4" }
];

function displayProductMatches() {
    if (!selectedColor) {
        console.log('No selected color');
        return;
    }
    
    console.log('Selected color:', selectedColor);
    
    const matchesColorInfo = document.getElementById('matchesColorInfo');
    const matchesColorCircle = document.getElementById('matchesColorCircle');
    const matchesColorText = document.getElementById('matchesColorText');
    const productGrid = document.getElementById('productGrid');

    if (matchesColorCircle) {
        matchesColorCircle.style.backgroundColor = selectedColor.hex;
    }
    if (matchesColorText) {
        matchesColorText.textContent = selectedColor.hex;
    }

    const matches = findColorMatches(selectedColor);
    console.log('Found matches:', matches);

    if (productGrid) {
        productGrid.innerHTML = '';

        if (matches.length === 0) {
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
            productGrid.appendChild(noMatchesMessage);
        } else {
            matches.forEach(match => {
                const productCard = createProductCard(match);
                productGrid.appendChild(productCard);
            });
        }
    } else {
        console.error('Product grid element not found');
    }
}

function findColorMatches(targetColor) {
    console.log('Finding matches for:', targetColor);
    
    const matches = productDatabase.map(product => {
        const productRgb = hexToRgb(product.hex);
        if (!productRgb) {
            console.error('Invalid hex color:', product.hex);
            return null;
        }

        const distance = calculateColorDistance(targetColor, productRgb);
        
        // Use a more lenient matching system
        // Maximum possible distance in RGB space is ~441 (sqrt(255² + 255² + 255²))
        const maxDistance = Math.sqrt(255*255 + 255*255 + 255*255);
        
        // Calculate match percentage - closer colors get higher percentages
        const matchPercentage = Math.max(0, 100 - (distance / maxDistance) * 100);
        
        return { 
            ...product, 
            distance, 
            matchPercentage: Math.round(matchPercentage * 10) / 10
        };
    }).filter(match => match !== null);
    
    // Sort by match percentage (highest first) and be more lenient with threshold
    const filteredMatches = matches
        .sort((a, b) => b.matchPercentage - a.matchPercentage)
        .slice(0, 20); // Show top 20 matches
    
    console.log('All matches found:', filteredMatches.length);
    console.log('Top matches:', filteredMatches.slice(0, 5));
    
    // If we have fewer than 8 good matches, lower the threshold
    if (filteredMatches.filter(m => m.matchPercentage >= 50).length < 8) {
        return filteredMatches.slice(0, 12); // Return top 12 regardless of percentage
    }
    
    // Otherwise, return matches above 30% threshold
    return filteredMatches.filter(match => match.matchPercentage >= 30).slice(0, 12);
}

function calculateColorDistance(color1, color2) {
    // Use weighted RGB distance that's more perceptually accurate
    const rDiff = color1.r - color2.r;
    const gDiff = color1.g - color2.g;
    const bDiff = color1.b - color2.b;
    
    // Weight the green channel more heavily as human eyes are more sensitive to green
    return Math.sqrt(2 * rDiff * rDiff + 4 * gDiff * gDiff + 3 * bDiff * bDiff);
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function createProductCard(product) {
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

document.addEventListener('DOMContentLoaded', () => {
    showSection('picker');
});