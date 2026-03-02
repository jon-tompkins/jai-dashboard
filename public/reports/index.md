---
layout: default
title: Archive
---

<style>
.report-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.report-item {
  border-bottom: 1px solid var(--border);
  padding: 1.25rem 0;
}

.report-item:last-child {
  border-bottom: none;
}

.report-item a {
  display: block;
}

.report-item-title {
  font-size: 1.125rem;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
  transition: color 0.15s;
}

.report-item:hover .report-item-title {
  color: var(--accent);
}

.report-item-meta {
  font-size: 0.875rem;
  color: var(--text-muted);
}

.report-item-desc {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-top: 0.5rem;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--text-muted);
}
</style>

{% assign sorted_reports = site.reports | sort: 'date' | reverse %}

{% if sorted_reports.size > 0 %}
<ul class="report-list">
  {% for report in sorted_reports %}
  <li class="report-item">
    <a href="{{ report.url | prepend: site.baseurl }}">
      <div class="report-item-title">{{ report.title }}</div>
      <div class="report-item-meta">{{ report.date | date: "%B %d, %Y" }}</div>
      {% if report.description %}
      <div class="report-item-desc">{{ report.description }}</div>
      {% endif %}
    </a>
  </li>
  {% endfor %}
</ul>
{% else %}
<div class="empty-state">
  <p>No reports yet.</p>
</div>
{% endif %}
