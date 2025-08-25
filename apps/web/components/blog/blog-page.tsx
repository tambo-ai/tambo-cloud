"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { categoryDisplayMap, type PostItem } from "@/lib/types/blog";
import { Search } from "lucide-react";
import Link from "next/link";
import { FC, useMemo, useState } from "react";

export const BlogPage: FC<{ posts: PostItem[] }> = ({ posts }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [sortOrder, setSortOrder] = useState("newest");

  const filterCounts = useMemo(() => {
    const counts: Record<string, number> = {
      All: posts.length,
      New: 0,
      Feature: 0,
      "Bug Fix": 0,
      Update: 0,
      Event: 0,
    };

    posts.forEach((post) => {
      const filterType =
        categoryDisplayMap[post.category.toLowerCase()] || "New";
      counts[filterType]++;
    });

    return counts;
  }, [posts]);

  const filteredPosts = useMemo(() => {
    let filtered = posts;

    if (searchQuery) {
      filtered = filtered.filter(
        (post) =>
          post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.category.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    if (selectedFilter !== "All") {
      filtered = filtered.filter((post) => {
        const filterType =
          categoryDisplayMap[post.category.toLowerCase()] || "New";
        return filterType === selectedFilter;
      });
    }

    const sorted = [...filtered].sort((a, b) => {
      const aT = new Date(a.dateISO ?? a.date).getTime();
      const bT = new Date(b.dateISO ?? b.date).getTime();
      return sortOrder === "newest" ? bT - aT : aT - bT;
    });

    return sorted;
  }, [posts, searchQuery, selectedFilter, sortOrder]);

  const featuredPost = posts.find((post) => post.featured);

  const filters = ["All", "New", "Feature", "Bug Fix", "Update", "Event"];

  const gradients = [
    "bg-gradient-to-br from-emerald-300 via-cyan-300 to-blue-400",
    "bg-gradient-to-br from-pink-300 via-rose-300 to-emerald-300",
    "bg-gradient-to-br from-blue-400 via-indigo-300 to-pink-300",
    "bg-gradient-to-br from-yellow-300 via-lime-300 to-emerald-300",
    "bg-gradient-to-br from-teal-400 via-cyan-400 to-blue-400",
    "bg-gradient-to-br from-emerald-400 via-teal-300 to-pink-300",
  ];

  return (
    <div className="min-h-screen bg-background">
      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold tracking-tight mb-4">
            tambo updates
          </h1>
          <p className="text-muted-foreground text-lg">
            Latest features, fixes, changes, and events from the tambo team.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-xl mx-auto mb-12">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder="Search posts..."
            className="pl-10 pr-4 py-2 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filter Tags */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
          {filters.map((filter) => (
            <Button
              key={filter}
              variant={selectedFilter === filter ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedFilter(filter)}
              className="rounded-full"
            >
              {filter}
              <span className="ml-2 text-xs opacity-60">
                {filterCounts[filter]}
              </span>
            </Button>
          ))}
        </div>

        {/* Featured Post */}
        {featuredPost && selectedFilter === "All" && !searchQuery && (
          <div className="mb-12">
            <Link href={`/blog/${featuredPost.id}`}>
              <div className="relative overflow-hidden rounded-2xl h-64 bg-gradient-to-br from-emerald-300 via-cyan-300 to-blue-300 p-8 hover:shadow-xl transition-shadow cursor-pointer">
                <div className="relative z-10">
                  <Badge
                    variant="secondary"
                    className="mb-4 bg-white/90 text-gray-700"
                  >
                    FEATURED
                  </Badge>
                  <h2 className=" text-3xl font-bold text-gray-900 mb-2">
                    {featuredPost.title}
                  </h2>
                  <p className="text-gray-700">{featuredPost.date}</p>
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Sort and Posts Count */}
        <div className="flex items-center justify-between mb-8">
          <p className="text-muted-foreground">{filteredPosts.length} posts</p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Sort:</span>
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post, index) => {
            const filterType =
              categoryDisplayMap[post.category.toLowerCase()] || "New";
            const gradient = gradients[index % gradients.length];

            return (
              <Link key={post.id} href={`/blog/${post.id}`}>
                <div className="group cursor-pointer">
                  <div
                    className={`relative overflow-hidden rounded-2xl h-48 ${gradient} p-6 hover:shadow-lg transition-shadow`}
                  >
                    <div className="relative z-10 h-full flex flex-col">
                      <Badge
                        variant="secondary"
                        className="mb-auto bg-white/90 text-gray-700 text-xs w-fit"
                      >
                        {filterType.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-4">
                    <h3 className=" text-lg font-semibold">{post.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {post.date}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredPosts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No posts found matching your criteria.
            </p>
          </div>
        )}
      </section>
    </div>
  );
};
