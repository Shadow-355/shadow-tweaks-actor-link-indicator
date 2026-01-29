/**
 * Actor Link Indicator
 * Displays a clickable Link/Unlinked icon in the Actor Sidebar.
 */

console.log("Shadow Tweaks - Actor Link Indicator | Module Loaded");

// --- CORE LOGIC: Injecting the UI ---
Hooks.on("renderActorDirectory", (app, html, data) => {
    // Only GMs need to see and toggle link status
    if (!game.user.isGM) return;

    const htmlElement = html[0] ?? html;
    // Targeting the specific entry classes found in DnD5e v5 / Foundry V13
    const documentList = htmlElement.querySelectorAll("li.directory-item.entry.document.actor");

    for (let li of documentList) {
        // Prevent duplicate icons if the sidebar re-renders partially
        if (li.querySelector(".actor-link-indicator-wrapper")) continue;

        const actorId = li.dataset.entryId;
        const actor = game.actors.get(actorId);
        if (!actor) continue;

        const isLinked = actor.prototypeToken?.actorLink;

        // 1. Create the Button Wrapper
        const wrapper = document.createElement('div');
        wrapper.className = "actor-link-indicator-wrapper";
        
        // Styling to align perfectly with Ownership Viewer and Foundry's flex rows
        Object.assign(wrapper.style, {
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginLeft: "2px",
            marginRight: "2px",
            height: "100%",
            order: "3", // Sits after portrait (1) and name (2)
            cursor: "pointer"
        });

        // 2. Create the Icon
        const icon = document.createElement('i');
        icon.className = `fas ${isLinked ? 'fa-link' : 'fa-link-slash'}`;
        
        Object.assign(icon.style, {
            fontSize: "12px",
            color: isLinked ? "#4caf50" : "#ff5252",
            filter: "drop-shadow(0 0 1px rgba(0,0,0,0.5))",
            pointerEvents: "none" // Ensures click event fires on the wrapper
        });

        wrapper.title = isLinked ? "Linked (Click to Unlink)" : "Unlinked (Click to Link)";
        wrapper.appendChild(icon);

        // 3. Add Click Interaction
        wrapper.addEventListener("click", async (event) => {
            event.preventDefault();
            event.stopPropagation(); // Prevents opening the actor sheet

            const newStatus = !actor.prototypeToken.actorLink;
            
            // Persist the change to the database
            await actor.update({ "prototypeToken.actorLink": newStatus });

            // Immediate UI update for responsiveness
            icon.className = `fas ${newStatus ? 'fa-link' : 'fa-link-slash'}`;
            icon.style.color = newStatus ? "#4caf50" : "#ff5252";
            wrapper.title = newStatus ? "Linked (Click to Unlink)" : "Unlinked (Click to Link)";
            
            ui.notifications.info(`${actor.name}: Actor Link ${newStatus ? "Enabled" : "Disabled"}`);
        });

        // 4. Smart Injection (Compatibility with Ownership Viewer)
        const ownershipViewer = li.querySelector(".ownership-viewer");
        if (ownershipViewer) {
            // Group our icon with the ownership dots on the right
            ownershipViewer.style.display = "inline-flex";
            ownershipViewer.style.marginLeft = "auto";
            ownershipViewer.style.order = "2";
            ownershipViewer.after(wrapper);
        } else {
            // If no ownership dots, push our icon to the far right alone
            wrapper.style.marginLeft = "auto";
            li.appendChild(wrapper);
        }
    }
});

// --- THE WATCHER: Keep UI in sync ---
// If the link status is changed via the Actor Sheet settings, update the sidebar icon.
Hooks.on("updateActor", (actor, changes, options, userId) => {
    if (foundry.utils.hasProperty(changes, "prototypeToken.actorLink")) {
        // Redraw the actor directory to reflect the internal change
        ui.actors.render();
    }
});