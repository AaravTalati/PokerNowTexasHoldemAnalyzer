# PokerNow Texas Hold'em Analyzer

**PokerNow Analyzer** is a powerful browser extension for [PokerNow.club](https://www.pokernow.club), designed to enhance online Texas Hold'em gameplay by providing real-time statistical insights.
Demo Video: https://youtu.be/yRsxOOtOmos
---

##  Features

- **Automatic Game State Recognition**  
  Reads your current hole cards, community cards, and number of players directly from the PokerNow game interface using DOM parsing techniques and mutation observers.

- **Real-Time Probabilities (Monte Carlo Simulation)**  
  Uses Monte Carlo simulation to estimate win probability, pot odds, and drawing odds based on the current hand and visible cards. Thousands of simulated hands are run in milliseconds to provide fast and accurate output.

- **Outs Detection & Hand Strength Estimation**  
  Dynamically calculates the number of outs that would improve your hand and estimates post-flop hand strength.

- **Preflop Hand Recommendations**  
  Before the flop, an overlay suggests whether to fold, call, or raise based on your starting hand, using simplified GTO-based charts.

- **Fully Customizable Overlay**  
  Toggle the overlay visibility and adjust display settings.
---

##  Technical Overview

- **Languages & Tools**: JavaScript, HTML/CSS, Chrome Extension APIs, MutationObserver, DOM parsing
- **Simulation Method**: Monte Carlo simulations with random sampling to evaluate win probability in multi-opponent settings
- **Performance**: Optimized to run simulations without slowing down gameplay.
- **Security**: No data is sent externally. All analysis is performed locally
