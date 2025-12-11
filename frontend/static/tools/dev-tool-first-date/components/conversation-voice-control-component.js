// ConversationVoiceControlComponent.js
// Encapsulates the voice control UI and logic for a conversation

class ConversationVoiceControlComponent {
    constructor(container, conversation, messages) {
        this.container = container;
        this.conversation = conversation;
        this.messages = messages || [];
        this.speechState = {
            messages: this.messages,
            currentIndex: 0,
            isPlaying: false,
            startTime: 0,
            utterance: null
        };
        this.render();
        this.bindEvents();
    }

    render() {
        this.container.innerHTML = `
            <div class="player-controls-header">
                <span class="player-label">🎧 Player</span>
                <div class="player-buttons">
                    <span id="btnPrev" title="Previous">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em">
                            <path d="M12 5v14l-7-7zm9-1v16h-2V4z"/>
                        </svg>
                    </span>
                    <span id="btnPlay" title="Play">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em">
                            <path d="M8 5v14l11-7z"/>
                        </svg>
                    </span>
                    <span id="btnPause" title="Pause" style="display:none;">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em">
                            <path d="M6 6h4v12H6zm8 0h4v12h-4z"/>
                        </svg>
                    </span>
                    <span id="btnNext" title="Next">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em">
                            <path d="M12 5v14l7-7zm-9 0v14h2V5z"/>
                        </svg>
                    </span>
                </div>
            </div>
        `;
    }

    bindEvents() {
        this.container.querySelector('#btnPlay')?.addEventListener('click', () => this.playConversation());
        this.container.querySelector('#btnPause')?.addEventListener('click', () => this.pauseConversation());
        this.container.querySelector('#btnNext')?.addEventListener('click', () => this.nextMessage());
        this.container.querySelector('#btnPrev')?.addEventListener('click', () => this.prevMessage());
    }

    playConversation() {
        const btnPlay = this.container.querySelector('#btnPlay');
        const btnPause = this.container.querySelector('#btnPause');
        if (!btnPlay || !btnPause) return;

        if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
            this.speechState.isPlaying = true;
            btnPlay.style.display = 'none';
            btnPause.style.display = 'inline';
            return;
        }

        if (this.speechState.isPlaying) return;

        this.speechState.isPlaying = true;
        btnPlay.style.display = 'none';
        btnPause.style.display = 'inline';
        this.speakMessage(this.speechState.currentIndex);
    }

    pauseConversation() {
        const btnPlay = this.container.querySelector('#btnPlay');
        const btnPause = this.container.querySelector('#btnPause');
        if (!btnPlay || !btnPause) return;
        window.speechSynthesis.cancel();
        this.speechState.isPlaying = false;
        this.speechState.utterance = null;
        btnPlay.style.display = 'inline';
        btnPause.style.display = 'none';
    }

    nextMessage() {
        window.speechSynthesis.cancel();
        this.speechState.utterance = null;
        if (this.speechState.currentIndex < this.speechState.messages.length - 1) {
            this.speechState.currentIndex++;
            this.playConversation();
        } else {
            this.speechState.isPlaying = false;
            const btnPlay = this.container.querySelector('#btnPlay');
            const btnPause = this.container.querySelector('#btnPause');
            if (btnPlay) btnPlay.style.display = 'inline';
            if (btnPause) btnPause.style.display = 'none';
        }
    }

    prevMessage() {
        const elapsed = Date.now() - this.speechState.startTime;
        window.speechSynthesis.cancel();
        this.speechState.utterance = null;
        if (elapsed < 3000 && this.speechState.currentIndex > 0) {
            this.speechState.currentIndex--;
        }
        this.playConversation();
    }

    async speakMessage(index) {
        if (index < 0 || index >= this.speechState.messages.length) {
            this.speechState.isPlaying = false;
            const btnPlay = this.container.querySelector('#btnPlay');
            const btnPause = this.container.querySelector('#btnPause');
            if (btnPlay) btnPlay.style.display = 'inline';
            if (btnPause) btnPause.style.display = 'none';
            return;
        }

        window.speechSynthesis.cancel();
        this.speechState.utterance = null;

        const msg = this.speechState.messages[index];
        const text = `${msg.member_nick_name} says: ${msg.message_text}`;
        const utterance = new SpeechSynthesisUtterance(text);
        // You may want to add voice selection logic here, or pass a voice selector as a prop
        utterance.onstart = (event) => {
            this.speechState.startTime = Date.now();
        };
        utterance.onend = (event) => {
            this.speechState.utterance = null;
            if (this.speechState.isPlaying) {
                this.speechState.currentIndex++;
                if (this.speechState.currentIndex < this.speechState.messages.length) {
                    this.speakMessage(this.speechState.currentIndex);
                } else {
                    this.speechState.isPlaying = false;
                    const btnPlay = this.container.querySelector('#btnPlay');
                    const btnPause = this.container.querySelector('#btnPause');
                    if (btnPlay) btnPlay.style.display = 'inline';
                    if (btnPause) btnPause.style.display = 'none';
                }
            }
        };
        utterance.onerror = (e) => {
            this.speechState.isPlaying = false;
            this.speechState.utterance = null;
        };
        this.speechState.utterance = utterance;
        try {
            window.speechSynthesis.speak(utterance);
        } catch (err) {
            // Handle error
        }
    }
}

window.ConversationVoiceControlComponent = ConversationVoiceControlComponent;
