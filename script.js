// script.js - JavaScript for Docker Tutorial Website

const HERO_MODEL_URL = 'https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@master/2.0/TriangleWithoutIndices/glTF-Binary/TriangleWithoutIndices.glb';
const THREE_MODULE_URL = 'https://unpkg.com/three@0.164.1/build/three.module.js';
const GLTF_LOADER_URL = 'https://unpkg.com/three@0.164.1/examples/jsm/loaders/GLTFLoader.js';

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initCopyButtons();
    initQuiz();
    initFAQ();
    initHeroExperience();
});

// Smooth scroll helper
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

function initNavigation() {
    const navLinks = document.querySelectorAll('#navbar a');
    const navLinksContainer = document.getElementById('nav-links');
    const hamburger = document.getElementById('hamburger');

    navLinks.forEach(link => {
        link.addEventListener('click', event => {
            event.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            scrollToSection(targetId);
            navLinksContainer.classList.remove('active');
        });
    });

    document.querySelectorAll('[data-scroll-target]').forEach(button => {
        button.addEventListener('click', () => {
            const target = button.getAttribute('data-scroll-target');
            scrollToSection(target);
        });
    });

    if (hamburger) {
        hamburger.addEventListener('click', () => {
            navLinksContainer.classList.toggle('active');
        });
    }
}

function initCopyButtons() {
    const copyButtons = document.querySelectorAll('.copy-btn');
    copyButtons.forEach(button => {
        button.addEventListener('click', () => {
            const command = button.getAttribute('data-command');
            if (!navigator.clipboard) {
                alert('Clipboard not available in this browser.');
                return;
            }

            navigator.clipboard.writeText(command).then(() => {
                const originalText = button.textContent;
                button.textContent = 'Copied!';
                button.style.backgroundColor = '#28a745';
                setTimeout(() => {
                    button.textContent = originalText;
                    button.style.backgroundColor = '';
                }, 2000);
            });
        });
    });
}

function initQuiz() {
    const checkAnswersBtn = document.getElementById('check-answers');
    if (!checkAnswersBtn) return;

    checkAnswersBtn.addEventListener('click', () => {
        const answers = {
            q1: 'b',
            q2: 'b',
            q3: 'b',
            q4: 'b',
            q5: 'b'
        };

        let score = 0;
        const resultDiv = document.getElementById('quiz-result');
        resultDiv.innerHTML = '';

        Object.entries(answers).forEach(([question, correctAnswer]) => {
            const selected = document.querySelector(`input[name="${question}"]:checked`);
            const questionBlock = document.querySelector(`input[name="${question}"]`).closest('.question');

            if (selected && selected.value === correctAnswer) {
                score++;
                questionBlock.style.color = 'green';
            } else {
                questionBlock.style.color = 'red';
            }
        });

        const totalQuestions = Object.keys(answers).length;
        resultDiv.innerHTML = `<h3>You scored ${score}/${totalQuestions}</h3>`;
        if (score === totalQuestions) {
            resultDiv.innerHTML += '<p>Perfect! You know your Docker basics.</p>';
        } else if (score >= totalQuestions / 2) {
            resultDiv.innerHTML += '<p>Good job! Review the incorrect answers.</p>';
        } else {
            resultDiv.innerHTML += '<p>Keep learning! Check the basics section again.</p>';
        }
        resultDiv.style.display = 'block';

        setTimeout(() => {
            document.querySelectorAll('.question').forEach(q => (q.style.color = ''));
        }, 5000);
    });
}

function initFAQ() {
    const faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            const answer = question.nextElementSibling;
            const isOpen = answer.style.maxHeight && answer.style.maxHeight !== '0px';

            document.querySelectorAll('.faq-answer').forEach(ans => {
                ans.style.maxHeight = '0px';
            });

            if (!isOpen) {
                answer.style.maxHeight = `${answer.scrollHeight}px`;
            }
        });
    });
}

function initHeroExperience() {
    const heroVisual = document.getElementById('hero-visual');
    const heroCanvas = document.getElementById('hero-canvas');
    const heroLoading = document.getElementById('hero-loading');

    if (!heroVisual || !heroCanvas) return;

    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const smallScreenQuery = window.matchMedia('(max-width: 767px)');

    const heroState = {
        renderer: null,
        scene: null,
        camera: null,
        model: null,
        animationFrameId: null,
        observer: null,
        isVisible: false,
        isInitialized: false,
        isStatic: false,
        loadingScene: false,
        targetTilt: { x: 0, y: 0 },
        currentTilt: { x: 0, y: 0 },
        THREE: null
    };

    const shouldUseStatic = () => reducedMotionQuery.matches || smallScreenQuery.matches || !isWebGLAvailable();

    const startObserver = () => {
        if (heroState.observer) return;
        heroState.observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                heroState.isVisible = entry.isIntersecting;
                if (entry.isIntersecting && !heroState.isInitialized && !heroState.loadingScene && !heroState.isStatic) {
                    loadHeroScene(heroState, heroCanvas, heroVisual, heroLoading);
                }

                toggleHeroRendering(heroState);
            });
        }, { rootMargin: '200px 0px 0px 0px', threshold: 0.1 });

        heroState.observer.observe(heroVisual);
    };

    const handlePreferenceChange = () => {
        if (shouldUseStatic()) {
            teardownHeroScene(heroState);
            activateStaticFallback(heroVisual, heroLoading, heroState);
        } else if (!heroState.isInitialized && !heroState.loadingScene) {
            heroVisual.classList.remove('is-static');
            if (heroLoading) {
                heroLoading.textContent = 'Loading 3D scene…';
                heroLoading.style.opacity = '';
                heroLoading.removeAttribute('aria-hidden');
            }
            heroState.isStatic = false;
            startObserver();
        }
    };

    reducedMotionQuery.addEventListener('change', handlePreferenceChange);
    smallScreenQuery.addEventListener('change', handlePreferenceChange);

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            cancelAnimationFrame(heroState.animationFrameId);
            heroState.animationFrameId = null;
        } else {
            toggleHeroRendering(heroState);
        }
    });

    window.addEventListener('resize', () => resizeHeroRenderer(heroState, heroCanvas));

    heroVisual.addEventListener('pointermove', event => handleHeroPointerMove(event, heroState, heroVisual));
    heroVisual.addEventListener('pointerleave', () => resetHeroTilt(heroState));

    if (shouldUseStatic()) {
        activateStaticFallback(heroVisual, heroLoading, heroState);
        return;
    }

    startObserver();
}

function activateStaticFallback(heroVisual, heroLoading, heroState) {
    heroState.isStatic = true;
    heroState.loadingScene = false;
    heroState.observer?.disconnect();
    heroState.observer = null;
    heroVisual.classList.add('is-static');
    heroVisual.classList.remove('is-3d-ready');
    if (heroLoading) {
        heroLoading.textContent = 'Static illustration';
        heroLoading.style.opacity = '';
        heroLoading.removeAttribute('aria-hidden');
    }
}

function isWebGLAvailable() {
    try {
        const canvas = document.createElement('canvas');
        return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (error) {
        return false;
    }
}

async function loadHeroScene(state, heroCanvas, heroVisual, heroLoading) {
    state.loadingScene = true;
    try {
        const [THREE, loaderModule] = await Promise.all([
            import(THREE_MODULE_URL),
            import(GLTF_LOADER_URL)
        ]);

        state.THREE = THREE;
        state.renderer = new THREE.WebGLRenderer({ canvas: heroCanvas, alpha: true, antialias: true, powerPreference: 'low-power' });
        state.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        resizeHeroRenderer(state, heroCanvas);

        state.scene = new THREE.Scene();
        state.camera = new THREE.PerspectiveCamera(35, heroCanvas.clientWidth / heroCanvas.clientHeight, 0.1, 100);
        state.camera.position.set(0, 0.4, 4);

        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x0d1b2a, 0.8);
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
        dirLight.position.set(5, 5, 5);
        state.scene.add(hemiLight);
        state.scene.add(dirLight);

        const loader = new loaderModule.GLTFLoader();
        loader.load(
            HERO_MODEL_URL,
            gltf => {
                state.model = gltf.scene;
                state.model.scale.set(2.5, 2.5, 2.5);
                state.model.rotation.y = Math.PI / 4;
                state.scene.add(state.model);
                state.isInitialized = true;
                heroVisual.classList.add('is-3d-ready');
                if (heroLoading) {
                    heroLoading.textContent = '';
                    heroLoading.style.opacity = '0';
                    heroLoading.setAttribute('aria-hidden', 'true');
                }
                state.isStatic = false;
                toggleHeroRendering(state);
            },
            undefined,
            error => {
                console.error('Failed to load hero model', error);
                activateStaticFallback(heroVisual, heroLoading, state);
            }
        );
    } catch (error) {
        console.error('Unable to initialize Three.js', error);
        activateStaticFallback(heroVisual, heroLoading, state);
    } finally {
        state.loadingScene = false;
    }
}

function resizeHeroRenderer(state, heroCanvas) {
    if (!state.renderer || !state.camera) return;
    const { clientWidth, clientHeight } = heroCanvas;
    state.renderer.setSize(clientWidth, clientHeight, false);
    state.camera.aspect = clientWidth / Math.max(clientHeight, 1);
    state.camera.updateProjectionMatrix();
}

function toggleHeroRendering(state) {
    if (!state.scene || !state.renderer || !state.camera || state.isStatic) return;
    if (state.isVisible && !state.animationFrameId) {
        const animate = () => {
            state.animationFrameId = requestAnimationFrame(animate);
            if (state.model) {
                state.model.rotation.y += 0.003;
                state.currentTilt.x = state.THREE.MathUtils.lerp(state.currentTilt.x, state.targetTilt.x, 0.08);
                state.currentTilt.y = state.THREE.MathUtils.lerp(state.currentTilt.y, state.targetTilt.y, 0.08);
                state.model.rotation.x = state.currentTilt.x;
                state.model.rotation.z = state.currentTilt.y;
            }
            state.renderer.render(state.scene, state.camera);
        };
        animate();
    } else if (!state.isVisible && state.animationFrameId) {
        cancelAnimationFrame(state.animationFrameId);
        state.animationFrameId = null;
    }
}

function handleHeroPointerMove(event, state, heroVisual) {
    if (!state.model || state.isStatic) return;
    const rect = heroVisual.getBoundingClientRect();
    const relativeX = (event.clientX - rect.left) / rect.width;
    const relativeY = (event.clientY - rect.top) / rect.height;
    state.targetTilt.x = (0.5 - relativeY) * 0.4; // tilt up/down
    state.targetTilt.y = (relativeX - 0.5) * 0.4; // roll
}

function resetHeroTilt(state) {
    state.targetTilt.x = 0;
    state.targetTilt.y = 0;
}

function teardownHeroScene(state) {
    cancelAnimationFrame(state.animationFrameId);
    state.animationFrameId = null;
    if (state.renderer) {
        state.renderer.dispose();
    }
    state.renderer = null;
    state.scene = null;
    state.camera = null;
    state.model = null;
    state.isInitialized = false;
}// script.js - JavaScript for Docker Tutorial Website

// Smooth scroll to sections
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

// Add event listeners to navigation links
document.addEventListener('DOMContentLoaded', function() {
    // Navigation smooth scroll
    const navLinks = document.querySelectorAll('#navbar a');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            scrollToSection(targetId);
            
            // Close mobile menu if open
            const navLinks = document.getElementById('nav-links');
            if (navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
            }
        });
    });

    // Hamburger menu toggle
    const hamburger = document.getElementById('hamburger');
    const navLinksContainer = document.getElementById('nav-links');
    hamburger.addEventListener('click', function() {
        navLinksContainer.classList.toggle('active');
    });

    // Copy to clipboard functionality
    const copyButtons = document.querySelectorAll('.copy-btn');
    copyButtons.forEach(button => {
        button.addEventListener('click', function() {
            const command = this.getAttribute('data-command');
            navigator.clipboard.writeText(command).then(function() {
                // Show "Copied!" message
                const originalText = button.textContent;
                button.textContent = 'Copied!';
                button.style.backgroundColor = '#28a745';
                setTimeout(function() {
                    button.textContent = originalText;
                    button.style.backgroundColor = '';
                }, 2000);
            });
        });
    });

    // Quiz functionality
    const checkAnswersBtn = document.getElementById('check-answers');
    checkAnswersBtn.addEventListener('click', function() {
        const answers = {
            q1: 'b', // A blueprint for containers
            q2: 'b', // docker ps
            q3: 'b', // Starts a container
            q4: 'b', // Docker Hub
            q5: 'b'  // A runnable instance of an image
        };

        let score = 0;
        const totalQuestions = Object.keys(answers).length;
        const resultDiv = document.getElementById('quiz-result');
        resultDiv.innerHTML = '';

        for (const [question, correctAnswer] of Object.entries(answers)) {
            const selected = document.querySelector(`input[name="${question}"]:checked`);
            const questionDiv = document.querySelector(`input[name="${question}"]`).closest('.question');
            
            if (selected && selected.value === correctAnswer) {
                score++;
                questionDiv.style.color = 'green';
            } else {
                questionDiv.style.color = 'red';
            }
        }

        resultDiv.innerHTML = `<h3>You scored ${score}/${totalQuestions}</h3>`;
        if (score === totalQuestions) {
            resultDiv.innerHTML += '<p>Perfect! You know your Docker basics.</p>';
        } else if (score >= totalQuestions / 2) {
            resultDiv.innerHTML += '<p>Good job! Review the incorrect answers.</p>';
        } else {
            resultDiv.innerHTML += '<p>Keep learning! Check the basics section again.</p>';
        }
        resultDiv.style.display = 'block';

        // Reset colors after 5 seconds
        setTimeout(function() {
            document.querySelectorAll('.question').forEach(q => q.style.color = '');
        }, 5000);
    });

    // FAQ accordion
    const faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach(question => {
        question.addEventListener('click', function() {
            const answer = this.nextElementSibling;
            const isOpen = answer.style.maxHeight !== '0px' && answer.style.maxHeight !== '';

            // Close all other answers
            document.querySelectorAll('.faq-answer').forEach(ans => {
                ans.style.maxHeight = '0px';
            });

            // Toggle this answer
            if (!isOpen) {
                answer.style.maxHeight = answer.scrollHeight + 'px';
            }
        });
    });
});