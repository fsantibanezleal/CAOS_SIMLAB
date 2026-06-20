turtles-own [
  happy?          ;; true if this agent is content with its current location
  similar-nearby  ;; number of same-color neighboring turtles
  total-nearby    ;; total number of neighboring turtles
]

globals [
  percent-similar ;; mean across happy agents of the fraction of same-color neighbors
  percent-unhappy ;; fraction of agents that are currently unhappy
]

to setup
  clear-all
  ;; fill the world with two colors of agents at the requested density,
  ;; leaving the rest of the patches empty.
  ask patches [
    if random 100 < density [
      sprout 1 [
        set color one-of [ blue orange ]
        set shape "circle"
        set size 0.9
      ]
    ]
  ]
  update-turtles
  update-globals
  reset-ticks
end

to go
  if all? turtles [ happy? ] [ stop ]
  move-unhappy-turtles
  update-turtles
  update-globals
  tick
end

to move-unhappy-turtles
  ask turtles with [ not happy? ] [
    find-new-spot
  ]
end

;; move to a random empty patch
to find-new-spot
  rt random-float 360
  fd random-float 10
  if any? other turtles-here [ find-new-spot ]  ;; keep trying until we land on an empty patch
  move-to patch-here
end

to update-turtles
  ask turtles [
    ;; count same-color neighbors and total neighbors
    set similar-nearby count (turtles-on neighbors) with [ color = [ color ] of myself ]
    set total-nearby count (turtles-on neighbors)
    ;; an agent is happy if the share of same-color neighbors meets its tolerance,
    ;; OR if it has no neighbors at all
    set happy? similar-nearby >= (%-similar-wanted * total-nearby / 100)
  ]
end

to update-globals
  let similar-neighbors sum [ similar-nearby ] of turtles
  let total-neighbors sum [ total-nearby ] of turtles
  set percent-similar (similar-neighbors / max (list 1 total-neighbors)) * 100
  set percent-unhappy (count turtles with [ not happy? ]) / (max (list 1 count turtles)) * 100
end
@#$#@#$#@
GRAPHICS-WINDOW
300
10
708
419
-1
-1
8.0
1
10
1
1
1
0
1
1
1
-25
25
-25
25
1
1
1
ticks
30.0

BUTTON
10
10
90
43
setup
setup
NIL
1
T
OBSERVER
NIL
NIL
NIL
NIL
1

BUTTON
100
10
180
43
go
go
T
1
T
OBSERVER
NIL
NIL
NIL
NIL
0

SLIDER
10
55
285
88
density
density
50.0
99.0
90.0
1.0
1
%
HORIZONTAL

SLIDER
10
95
285
128
%-similar-wanted
%-similar-wanted
0.0
100.0
50.0
1.0
1
%
HORIZONTAL

MONITOR
10
140
145
185
% unhappy
percent-unhappy
1
1
11

MONITOR
155
140
285
185
% similar
percent-similar
1
1
11

PLOT
10
195
285
355
Segregation
time
%
0.0
25.0
0.0
100.0
true
true
"" ""
PENS
"percent similar" 1.0 0 -2674135 true "" "plot percent-similar"
"percent unhappy" 1.0 0 -10899396 true "" "plot percent-unhappy"
@#$#@#$#@
Schelling segregation — a small original model authored for CAOS_SIMLAB.
Agents of two colors relocate while the share of same-color neighbors is below their
tolerance (%-similar-wanted). A modest preference still drives strong segregation.
@#$#@#$#@
default
true
0
Polygon -7500403 true true 150 5 40 250 150 205 260 250

circle
false
0
Circle -7500403 true true 0 0 300
@#$#@#$#@
NetLogo 6.4.0
@#$#@#$#@
@#$#@#$#@
@#$#@#$#@
@#$#@#$#@
@#$#@#$#@
default
0.0
-0.2 0 0.0 1.0
0.0 1 1.0 0.0
0.2 0 0.0 1.0
link direction
true
0
Line -7500403 true 150 150 90 180
Line -7500403 true 150 150 210 180
@#$#@#$#@
0
@#$#@#$#@
