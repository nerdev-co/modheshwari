"use client";

import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MOTION_PAGE_ENTER } from "@repo/ui/motion";

import { useLocale } from "../../lib/LocaleContext";
import { useUser } from "../../lib/UserContext";

export default function ActivityPage() {
    const navigate = useNavigate();
    const { t } = useLocale();
    const { user } = useUser();

    if (!user) {
        navigate("/signin");
        return null;
    }

    const activity = [
        { action: "Rajesh added a family member", time: "12 minutes ago", date: "Today" },
        { action: "Event registration approved", time: "32 minutes ago", date: "Today" },
        { action: "New resource request", time: "1 hour ago", date: "Today" },
        { action: "New community announcement", time: "2 hours ago", date: "Today" },
        { action: "Family gathering scheduled", time: "Yesterday", date: "Yesterday" },
        { action: "Member joined Shah family", time: "Yesterday", date: "Yesterday" },
    ];

    const grouped = activity.reduce<Record<string, typeof activity>>((acc, item) => {
        if (!acc[item.date]) acc[item.date] = [];
        acc[item.date]!.push(item);
        return acc;
    }, {});

    return (
        <div className="min-h-screen">
            <div className="mx-auto max-w-[1100px] px-6 py-10 sm:px-8 lg:px-10 lg:py-14">

                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={MOTION_PAGE_ENTER}
                    className="mb-14"
                >
                    <h1 className="font-display text-[36px] font-semibold leading-tight text-ink">
                        {t("nav.activity")}
                    </h1>
                    <p className="text-[15px] text-ink-secondary mt-1">
                        Your community participation
                    </p>
                </motion.div>

                <div className="h-px bg-border" />

                <div className="py-10">
                    {Object.entries(grouped).map(([date, items]) => (
                        <div key={date} className="mb-10 last:mb-0">
                            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted mb-4">
                                {date}
                            </h2>
                            <div className="space-y-0">
                                {items.map((item, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-start gap-4 py-3 border-b border-border-subtle last:border-0"
                                    >
                                        <div className="mt-1.5 flex-shrink-0">
                                            <div className="h-1.5 w-1.5 rounded-full bg-saffron" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[14px] text-ink">
                                                {item.action}
                                            </p>
                                            <p className="text-[12px] text-ink-muted mt-0.5">
                                                {item.time}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
}
