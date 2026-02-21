/*
    AISuggestionHandler: Encapsulates AI autocomplete functionality for text inputs
    - Manages debouncing, timeouts, and overlay display
    - Handles keyboard interactions (Tab to accept, Escape to dismiss)
    - Computes word fragments for deterministic suggestion acceptance
    - Self-contained with no shared state between instances
*/
class AISuggestionHandler {
    constructor(options) {
        // Required parameters
        this.inputElement = options.inputElement;
        this.aiSuggestionFn = options.aiSuggestionFn;
        this.context = options.context;
        this.onValueChange = options.onValueChange;
        
        // Optional parameters with defaults
        this.debounceMs = options.debounceMs !== undefined ? options.debounceMs : 2000;
        this.timeoutMs = options.timeoutMs !== undefined ? options.timeoutMs : 10000;
        
        // Internal state
        this.currentSuggestion = null;
        this.debouncer = null;
        this.suggestionOverlay = null;
        this.keyboardCleanup = null;
        this.scheduleAutoHide = null;
        this.inputListener = null;
        
        this.initialize();
    }
    
    initialize() {
        // Create debouncer
        this.debouncer = this.createDebouncer(this.debounceMs);
        
        // Create overlay
        this.suggestionOverlay = this.createOverlay();
        
        // Setup keyboard handling
        const keyboardHandler = this.setupKeyboardHandling();
        this.keyboardCleanup = keyboardHandler.cleanup;
        this.scheduleAutoHide = keyboardHandler.scheduleAutoHide;
        
        // Listen to input events
        this.inputListener = () => this.requestSuggestion();
        this.inputElement.addEventListener('input', this.inputListener);
    }
    
    createDebouncer(delayMs) {
        let timeoutId = null;
        let abortController = null;
        
        return {
            schedule: (callback) => {
                if (timeoutId) {
                    clearTimeout(timeoutId);
                }
                if (abortController) {
                    abortController.abort();
                }
                
                abortController = new AbortController();
                const signal = abortController.signal;
                
                timeoutId = setTimeout(async () => {
                    if (!signal.aborted) {
                        await callback(signal);
                    }
                }, delayMs);
            },
            
            cancel: () => {
                if (timeoutId) {
                    clearTimeout(timeoutId);
                    timeoutId = null;
                }
                if (abortController) {
                    abortController.abort();
                    abortController = null;
                }
            }
        };
    }
    
    createOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'ai-suggestion-tooltip';
        overlay.style.position = 'fixed';
        overlay.style.display = 'none';
        overlay.style.backgroundColor = '#2c2c2c';
        overlay.style.color = '#aaa';
        overlay.style.padding = '4px 8px';
        overlay.style.borderRadius = '4px';
        overlay.style.fontSize = '13px';
        overlay.style.fontFamily = 'monospace';
        overlay.style.zIndex = '10000';
        overlay.style.pointerEvents = 'none';
        overlay.style.maxWidth = '400px';
        overlay.style.wordWrap = 'break-word';
        overlay.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
        overlay.style.border = '1px solid #444';
        
        document.body.appendChild(overlay);
        return overlay;
    }
    
    updateOverlay(suggestion) {
        if (!suggestion) {
            this.suggestionOverlay.style.display = 'none';
            return;
        }
        
        this.suggestionOverlay.textContent = suggestion;
        this.suggestionOverlay.style.display = 'block';
        
        const rect = this.inputElement.getBoundingClientRect();
        this.suggestionOverlay.style.top = (rect.top - 16 - this.suggestionOverlay.offsetHeight) + 'px';
        this.suggestionOverlay.style.left = rect.left + 'px';
    }
    
    setupKeyboardHandling() {
        let autoHideTimeout = null;
        
        const scheduleAutoHide = () => {
            if (autoHideTimeout) {
                clearTimeout(autoHideTimeout);
            }
            autoHideTimeout = setTimeout(() => {
                this.clearHighlight();
                this.suggestionOverlay.textContent = '';
                this.suggestionOverlay.style.display = 'none';
                this.currentSuggestion = null;
            }, 20000); // 20 seconds for debugging
        };
        
        const handleKeyDown = (e) => {
            if (e.key === 'Tab' && this.currentSuggestion) {
                e.preventDefault();
                this.acceptSuggestion();
                this.suggestionOverlay.textContent = '';
                this.suggestionOverlay.style.display = 'none';
                if (autoHideTimeout) {
                    clearTimeout(autoHideTimeout);
                }
            } else if (e.key === 'Escape' && this.currentSuggestion) {
                this.clearHighlight();
                this.suggestionOverlay.textContent = '';
                this.suggestionOverlay.style.display = 'none';
                this.currentSuggestion = null;
                if (autoHideTimeout) {
                    clearTimeout(autoHideTimeout);
                }
            }
        };
        
        this.inputElement.addEventListener('keydown', handleKeyDown);
        
        return {
            cleanup: () => {
                this.inputElement.removeEventListener('keydown', handleKeyDown);
                if (autoHideTimeout) {
                    clearTimeout(autoHideTimeout);
                }
            },
            scheduleAutoHide: scheduleAutoHide
        };
    }
    
    async requestSuggestion() {
        if (!this.aiSuggestionFn) return;
        
        const currentValue = this.inputElement.value;
        const cursorPosition = this.inputElement.selectionStart;
        
        // Compute word fragments at cursor (used for acceptance logic)
        const leftFragment = this.getLeftFragment(currentValue, cursorPosition);
        const rightFragment = this.getRightFragment(currentValue, cursorPosition);
        
        console.log('[AI Autocomplete] Requesting suggestion:', {
            currentValue: currentValue,
            cursorPosition: cursorPosition,
            leftFragment: leftFragment,
            rightFragment: rightFragment,
            valueLength: currentValue.length
        });
        
        this.debouncer.schedule(async (signal) => {
            if (signal.aborted) return;
            
            const result = await this.callWithTimeout(
                () => this.aiSuggestionFn(
                    null,           // container
                    currentValue,   // fullText
                    cursorPosition, // cursorPosition
                    leftFragment,   // leftFragment
                    rightFragment,  // rightFragment
                    this.context    // context
                ),
                this.timeoutMs
            );
            
            console.log('[AI Autocomplete] Received result:', {
                result: result,
                currentInputValue: this.inputElement.value,
                currentCursorPosition: this.inputElement.selectionStart,
                originalValue: currentValue,
                originalCursorPosition: cursorPosition,
                valuesMatch: this.inputElement.value === currentValue,
                cursorMatch: this.inputElement.selectionStart === cursorPosition
            });
            
            // Abort if input value or cursor moved since request
            if (!signal.aborted && result && 
                this.inputElement.value === currentValue && 
                this.inputElement.selectionStart === cursorPosition) {
                
                this.updateOverlay(result);
                
                // Highlight the text that will be replaced
                this.highlightReplacementText(cursorPosition, leftFragment, rightFragment);
                
                this.currentSuggestion = {
                    completion: result,
                    leftFragment: leftFragment,
                    rightFragment: rightFragment,
                    cursorPosition: cursorPosition
                };
                
                if (this.scheduleAutoHide) {
                    this.scheduleAutoHide();
                }
            } else {
                this.currentSuggestion = null;
                this.updateOverlay(null);
                this.clearHighlight();
            }
        });
    }
    
    async callWithTimeout(aiFunction, timeoutMs) {
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('AI suggestion timeout')), timeoutMs);
        });
        
        try {
            const result = await Promise.race([
                aiFunction(),
                timeoutPromise
            ]);
            console.log('[AI Autocomplete] callWithTimeout result:', result);
            return result;
        } catch (error) {
            console.log('[AI Autocomplete] callWithTimeout error:', error);
            return null;
        }
    }
    
    getLeftFragment(text, cursorPos) {
        let start = cursorPos - 1;
        while (start >= 0 && !this.isFragmentBoundary(text[start])) {
            start--;
        }
        // Include the boundary character (.,;!?) in the fragment
        return text.substring(start, cursorPos);
    }
    
    getRightFragment(text, cursorPos) {
        let end = cursorPos;
        while (end < text.length && !this.isFragmentBoundary(text[end])) {
            end++;
        }
        // Include the boundary character (.,;!?) in the fragment
        if (end < text.length && this.isFragmentBoundary(text[end])) {
            end++;
        }
        return text.substring(cursorPos, end);
    }
    
    isFragmentBoundary(char) {
        // Sentence/phrase boundaries (not word boundaries)
        return /[.,;!?]/.test(char);
    }
    
    highlightReplacementText(cursorPos, leftFragment, rightFragment) {
        // Calculate the selection range to highlight text that will be replaced
        const selectionStart = cursorPos - leftFragment.length;
        const selectionEnd = cursorPos + rightFragment.length;
        
        // Only highlight if there's text to replace
        if (leftFragment.length > 0 || rightFragment.length > 0) {
            this.inputElement.setSelectionRange(selectionStart, selectionEnd);
        }
    }
    
    clearHighlight() {
        // Restore cursor to original position (no selection)
        if (this.currentSuggestion) {
            const cursorPos = this.currentSuggestion.cursorPosition;
            this.inputElement.setSelectionRange(cursorPos, cursorPos);
        }
    }
    
    acceptSuggestion() {
        if (!this.currentSuggestion) return;
        
        const currentValue = this.inputElement.value;
        const cursorPos = this.inputElement.selectionStart;
        const completion = this.currentSuggestion.completion;
        const leftFragment = this.currentSuggestion.leftFragment;
        const rightFragment = this.currentSuggestion.rightFragment;
        const originalCursorPos = this.currentSuggestion.cursorPosition;
        
        console.log('[AI Autocomplete] Accepting suggestion:', {
            cursorPos: cursorPos,
            originalCursorPos: originalCursorPos,
            currentValue: currentValue,
            completion: completion,
            leftFragment: leftFragment,
            rightFragment: rightFragment
        });
        
        // Delete leftFragment before cursor and rightFragment after cursor
        const beforeFragment = currentValue.substring(0, originalCursorPos - leftFragment.length);
        const afterFragment = currentValue.substring(originalCursorPos + rightFragment.length);
        
        const newValue = beforeFragment + completion + afterFragment;
        const newCursorPos = beforeFragment.length + completion.length;
        
        console.log('[AI Autocomplete] Result:', {
            newValue: newValue,
            newCursorPos: newCursorPos
        });
        
        this.currentSuggestion = null;
        
        // Call the callback to update the component
        if (this.onValueChange) {
            this.onValueChange(newValue, newCursorPos);
        }
    }
    
    destroy() {
        if (this.inputListener) {
            this.inputElement.removeEventListener('input', this.inputListener);
        }
        if (this.keyboardCleanup) {
            this.keyboardCleanup();
        }
        if (this.debouncer) {
            this.debouncer.cancel();
        }
        if (this.suggestionOverlay && this.suggestionOverlay.parentElement) {
            this.suggestionOverlay.remove();
        }
    }
}

// Export to window
window.AISuggestionHandler = AISuggestionHandler;
