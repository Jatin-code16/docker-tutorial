// script.js - JavaScript for Docker Tutorial Website

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