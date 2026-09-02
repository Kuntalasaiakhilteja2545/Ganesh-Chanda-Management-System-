from django.contrib import admin
from .models import Festival, CommitteeMember


class CommitteeMemberInline(admin.TabularInline):
    model = CommitteeMember
    extra = 1
    fields = ['name', 'name_telugu', 'designation', 'mobile_number', 'display_order', 'is_active']


@admin.register(Festival)
class FestivalAdmin(admin.ModelAdmin):
    list_display = ['name', 'year', 'association_name', 'location', 'is_active']
    list_filter = ['is_active', 'year']
    search_fields = ['name', 'association_name', 'location']
    inlines = [CommitteeMemberInline]


@admin.register(CommitteeMember)
class CommitteeMemberAdmin(admin.ModelAdmin):
    list_display = ['name', 'name_telugu', 'designation', 'mobile_number', 'festival', 'display_order', 'is_active']
    list_filter = ['festival', 'designation', 'is_active']
    search_fields = ['name', 'name_telugu', 'mobile_number']
    ordering = ['festival', 'display_order', 'id']
