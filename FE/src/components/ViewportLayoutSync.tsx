import React, { useEffect } from "react";
import { subscribeVisualViewport, syncViewportLayout } from "../utils/visualViewport";

const ViewportLayoutSync: React.FC = () => {
    useEffect(() => {
        syncViewportLayout();
        return subscribeVisualViewport(syncViewportLayout);
    }, []);

    return null;
};

export default ViewportLayoutSync;
